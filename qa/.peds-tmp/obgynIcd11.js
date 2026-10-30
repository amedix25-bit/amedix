// Obstetrics & Gynecology ICD-11 MMS reference catalogue.
//
// WHAT THIS IS, AND WHAT IT IS NOT
//
// Every code and display term below was read from the published ICD-11 MMS
// tabulation for release 2026-01 (the current release at the time of writing,
// 2026-10-28) as mirrored by Find-A-Code's ICD-11 MMS browser, which reproduces
// the WHO tabulation verbatim:
//   Chapter 18 — Pregnancy, childbirth or the puerperium (blocks JA00–JA0Z,
//   JA20–JA2Z, JA40–JA4Z) and
//   Chapter 16 — Diseases of the genitourinary system (blocks GA10, GA12–GA1Z,
//   GA20–GA2Z, GA30–GA34).
// Titles are copied exactly as published. Nothing here is generated from a
// clinical phrase, inferred from a symptom, or completed from memory.
//
// RELEASE DIFFERENCE — recorded, not hidden. The Endocrinology catalogue in this
// app was built on release 2025-01. This catalogue is on 2026-01, because that
// is the release in force when the Obstetrics & Gynecology notes were audited.
// Each entry stores its own release, so a note always says which release its
// code was verified against; the two are never silently mixed.
//
// COVERAGE IS DELIBERATELY EXPLICIT. This is a curated core for the conditions
// the Obstetrics & Gynecology notes actually document — not the whole of
// Chapters 16 and 18. A diagnosis outside the catalogue is entered by the
// clinician from the WHO ICD-11 browser (icd.who.int) and is stored with
// mapping_state "review_required" until it is checked — the field never
// suggests, completes or invents a code. Known gaps, stated rather than hidden:
//   · Labour and delivery complications other than obstetric haemorrhage
//     (obstructed labour, fetal presentation, cord complications) — not in this
//     build; code from the WHO browser.
//   · Puerperal sepsis and other puerperal infections — not in this build.
//   · Inflammatory disorders of the female genital tract (GA00–GA0Z): only the
//     block is known to this build, no categories were verified, so none is
//     offered rather than an unverified code.
//   · Neoplasms (fibroids, ovarian and cervical tumours): Chapter 02 codes must
//     carry histology and are coded from the WHO browser with their morphology.
//   · Gestational diabetes and other maternal medical conditions: the maternal
//     condition codes come from their own chapters and are entered with the
//     pregnancy context recorded in the note's own fields.
//   · Symptoms (MF30–MF3Y) are signs, not diagnoses. The note records them as
//     findings and the field does not offer them as diagnoses.
//
// A code is never a diagnosis. The field records role (primary/secondary),
// status (confirmed/provisional/differential), maternal context and the clinical
// basis, and only a clinician confirms.

export const OBGYN_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  release: "2026-01",
  label: "ICD-11 MMS",
  chapter: "Chapter 18 — Pregnancy, childbirth or the puerperium; Chapter 16 — Diseases of the genitourinary system",
  browser_url: "https://icd.who.int/browse/2026-01/mms/en",
  source_url: "https://www.findacode.com/icd-11/",
  retrieved: "2026-10-28",
};

export const OBGYN_ICD11_DOMAINS = {
  early_pregnancy: "Abortive outcome of pregnancy (early pregnancy loss)",
  hypertensive: "Oedema, proteinuria or hypertensive disorders in pregnancy, childbirth or the puerperium",
  haemorrhage: "Obstetric haemorrhage",
  endometriosis: "Endometriosis and adenomyosis",
  gyn_benign: "Noninflammatory and acquired disorders of the female genital tract",
  gyn_bleeding: "Abnormal uterine or vaginal bleeding",
  menopause: "Menopausal and perimenopausal disorders",
  fertility: "Infertility, medically assisted reproduction and recurrent pregnancy loss",
  gyn_pain: "Female pelvic pain associated with the genital organs or menstrual cycle",
};

// code | official display term | domain
const RAW = [
  // ---- Abortive outcome of pregnancy (JA00–JA0Z) ---------------------------
  "JA00|Abortion|early_pregnancy",
  "JA01|Ectopic pregnancy|early_pregnancy",
  "JA02|Molar pregnancy|early_pregnancy",
  "JA03|Missed abortion|early_pregnancy",
  "JA04|Blighted ovum or nonhydatidiform mole|early_pregnancy",
  "JA05|Complications following abortion, ectopic or molar pregnancy|early_pregnancy",
  "JA0Z|Abortive outcome of pregnancy, unspecified|early_pregnancy",

  // ---- Hypertensive disorders (JA20–JA2Z) ---------------------------------
  "JA20|Pre-existing hypertension complicating pregnancy, childbirth or the puerperium|hypertensive",
  "JA21|Pre-eclampsia superimposed on chronic hypertension|hypertensive",
  "JA22|Gestational oedema or proteinuria without hypertension|hypertensive",
  "JA23|Gestational hypertension|hypertensive",
  "JA24|Pre-eclampsia|hypertensive",
  "JA25|Eclampsia|hypertensive",
  "JA2Z|Oedema, proteinuria, or hypertensive disorders in pregnancy, childbirth, or the puerperium, unspecified|hypertensive",

  // ---- Obstetric haemorrhage (JA40–JA4Z) ----------------------------------
  "JA40|Haemorrhage in early pregnancy|haemorrhage",
  "JA41|Antepartum haemorrhage|haemorrhage",
  "JA42|Intrapartum haemorrhage|haemorrhage",
  "JA43|Postpartum haemorrhage|haemorrhage",
  "JA43.0|Third-stage haemorrhage|haemorrhage",
  "JA43.1|Other immediate postpartum haemorrhage|haemorrhage",
  "JA43.2|Delayed or secondary postpartum haemorrhage|haemorrhage",
  "JA43.3|Postpartum coagulation defects|haemorrhage",
  "JA43.4|Postpartum haemorrhage following obstructed labour with uterine rupture|haemorrhage",
  "JA43.5|Postpartum haemorrhage following obstructed labour without mention of uterine rupture|haemorrhage",
  "JA43.Y|Other specified postpartum haemorrhage|haemorrhage",
  "JA43.Z|Postpartum haemorrhage, unspecified|haemorrhage",
  "JA4Z|Obstetric haemorrhage, unspecified|haemorrhage",

  // ---- Endometriosis and adenomyosis --------------------------------------
  "GA10|Endometriosis|endometriosis",
  "GA10.B|Endometriosis of the reproductive system|endometriosis",
  "GA10.C|Endometriosis of the digestive system|endometriosis",
  "GA10.D|Endometriosis of urinary system|endometriosis",
  "GA10.E|Endometriosis of the circulatory system|endometriosis",
  "GA10.F|Endometriosis of the nervous system|endometriosis",
  "GA10.G|Thoracic endometriosis|endometriosis",
  "GA10.H|Endometriosis in cutaneous scar|endometriosis",
  "GA10.J|Endometriosis-related adhesions|endometriosis",
  "GA10.Y|Endometriosis of other specified sites|endometriosis",
  "GA10.Z|Endometriosis of unspecified site|endometriosis",
  "GA11|Adenomyosis|endometriosis",

  // ---- Noninflammatory and acquired female genital tract disorders --------
  "GA12|Female dyspareunia|gyn_benign",
  "GA13|Acquired abnormalities of vulva or perineum|gyn_benign",
  "GA14|Acquired abnormalities of vagina|gyn_benign",
  "GA15|Acquired abnormalities of cervix uteri|gyn_benign",
  "GA16|Acquired abnormalities of uterus, except cervix|gyn_benign",
  "GA17|Acquired abnormalities of fallopian tube|gyn_benign",
  "GA18|Acquired abnormalities of ovary|gyn_benign",
  "GA19|Acquired abnormalities of broad ligament|gyn_benign",
  "GA1Y|Other specified noninflammatory disorders of female genital tract|gyn_benign",
  "GA1Z|Noninflammatory disorders of female genital tract, unspecified|gyn_benign",

  // ---- Abnormal uterine or vaginal bleeding (GA20–GA2Z) -------------------
  "GA20|Menstrual cycle bleeding disorders|gyn_bleeding",
  "GA21|Nonmenstrual bleeding disorders|gyn_bleeding",
  "GA22|Excessive menstruation with irregular cycle|gyn_bleeding",
  "GA23|Anovulatory bleeding|gyn_bleeding",
  "GA2Y|Other specified abnormal uterine or vaginal bleeding|gyn_bleeding",
  "GA2Z|Abnormal uterine or vaginal bleeding, unspecified|gyn_bleeding",

  // ---- Menopause, fertility and pelvic pain ------------------------------
  "GA30|Menopausal or perimenopausal disorders|menopause",
  "GA30.1|Postmenopausal uterine bleeding|menopause",
  "GA31|Female infertility|fertility",
  "GA32|Complications associated with medically assisted reproduction|fertility",
  "GA33|Recurrent pregnancy loss|fertility",
  "GA34|Female pelvic pain associated with genital organs or menstrual cycle|gyn_pain",
];

export const OBGYN_ICD11 = RAW.map((line) => {
  const [code, display, domain] = line.split("|");
  const domainLabel = OBGYN_ICD11_DOMAINS[domain] || domain;
  const specific = code.includes(".");
  return {
    code,
    display,
    domain,
    domain_label: domainLabel,
    system: OBGYN_ICD11_MMS.system,
    system_uri: OBGYN_ICD11_MMS.system_uri,
    release: OBGYN_ICD11_MMS.release,
    version: `${OBGYN_ICD11_MMS.label} ${OBGYN_ICD11_MMS.release}`,
    source: OBGYN_ICD11_MMS.source_url,
    browser: OBGYN_ICD11_MMS.browser_url,
    verified_date: OBGYN_ICD11_MMS.retrieved,
    precise: true,
    specificity: specific
      ? "Subcategory — most specific"
      : "Category — select a subcategory when one is documented",
    aliases: `${display} ${domainLabel}`,
    definition:
      `WHO ICD-11 MMS ${OBGYN_ICD11_MMS.release} category in ${domainLabel}. ` +
      "No inclusion or exclusion notes are reproduced — confirm the exact category, and any code-also " +
      "instruction, against the WHO ICD-11 browser before relying on a residual (…Y / …Z) code.",
  };
});

// The catalogue a note offers: only the domains that note can code, so an
// antenatal note never suggests a gynecologic bleeding code.
export const obgynCatalogFor = (domains) => {
  const wanted = Array.isArray(domains) ? domains : [];
  if (!wanted.length) return OBGYN_ICD11;
  return OBGYN_ICD11.filter((i) => wanted.includes(i.domain));
};

export const OBGYN_ICD11_COUNT = OBGYN_ICD11.length;

// Shown in the note, beside the coding field, so the limitation is visible to
// the clinician rather than buried in documentation.
export const OBGYN_CODING_LIMITATION =
  `Catalogue release ${OBGYN_ICD11_MMS.release} · ${OBGYN_ICD11_COUNT} verified categories covering early pregnancy loss, ` +
  "hypertensive disorders, obstetric haemorrhage and common gynecologic conditions. No live WHO API is called. " +
  "A diagnosis outside this list is entered from the WHO ICD-11 browser and stored as mapping review required.";