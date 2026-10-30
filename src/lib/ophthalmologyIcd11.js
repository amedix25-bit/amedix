// Ophthalmology ICD-11 MMS reference catalogue.
//
// Every code and display term below was read from the ICD-11 MMS tabulation,
// release 2026-01, Chapter 09 "Diseases of the visual system" (plus Chapter 22
// for eye and orbit injury and Chapter 20 for congenital eye anomalies), and
// copied verbatim — the wording is WHO's. Nothing is generated or guessed: an
// entry that was not read from the tabulation is NOT offered, and a clinician
// can always add a code from the WHO browser, which the note stores as REVIEW
// REQUIRED until it is checked against the catalogue.
//
// Scope — what an ophthalmology note documents:
//   ocular adnexa & orbit · conjunctiva · cornea · anterior chamber ·
//   anterior uvea · lens · sclera, choroid, retina, vitreous · macula ·
//   glaucoma · optic nerve and visual pathways · strabismus & motility ·
//   refraction · post-procedural states · vision impairment · ocular trauma
//
// Deliberately NOT included, and stated rather than silently omitted:
//  - Intraocular and adnexal NEOPLASMS (retinoblastoma, uveal melanoma,
//    eyelid malignancy). They sit in Chapter 02 and are coded by the oncology
//    service; a tumour code must be taken from the WHO browser so an incomplete
//    code is never applied to a patient.
//  - Laterality. WHO carries it as a postcoordination axis (XK8G left,
//    XK9K right, XK9J bilateral); the note records the eye in its own fields and
//    the code is never rewritten to carry it.
//  - Severity and staging detail (diabetic retinopathy level, glaucoma stage,
//    ROP stage and zone, cataract density). These are structured fields in the
//    note; the stem code is never altered to carry them.
//  - Symptom-level codes (red eye, blurred vision, floaters). A symptom is
//    documented as a symptom and never coded as a disease.
//
// A code is never a diagnosis. The field records role, status, mapping state and
// the clinician's documented basis, and only a clinician confirms a diagnosis.

export const OPHTH_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  release: "2026-01",
  label: "ICD-11 MMS",
  chapter: "Chapter 09 — Diseases of the visual system",
  browser_url: "https://icd.who.int/browse/2026-01/mms/en",
  source_url: "https://icd.who.int/browse/2026-01/mms/en",
  retrieved: "2026-10-30",
  read_from:
    "ICD-11 MMS tabulation, release 2026-01 — Chapter 09 categories and subcategories; Chapter 22 for eye and orbit injury; Chapter 20 for congenital anomalies of the eye",
};

export const OPHTH_ICD11_DOMAINS = {
  adnexa: "Eyelid, lacrimal apparatus and orbit",
  conjunctiva: "Conjunctiva",
  cornea: "Cornea",
  anterior_uvea: "Anterior uvea (iris and ciliary body)",
  lens: "Lens and cataract",
  retina: "Retina and vitreous",
  macula: "Macula",
  glaucoma: "Glaucoma and glaucoma suspect",
  optic_nerve: "Optic nerve and visual pathways",
  motility: "Strabismus and ocular motility",
  refraction: "Refraction and accommodation",
  postprocedural: "Post-procedural states",
  vision: "Vision impairment",
  trauma: "Ocular trauma",
  congenital: "Congenital anomalies of the eye",
};

// code | official display term | domain | primary tabulation entry (1 = yes) | Arabic term
const RAW = [
  // ---- Ocular adnexa and orbit --------------------------------------------
  "9A01|Infectious disorders of eyelid|adnexa|1|اضطرابات معدية في الجفن",
  "9A02|Inflammatory disorders of eyelid|adnexa|1|اضطرابات التهابية في الجفن",
  "9A03|Acquired malposition of eyelid|adnexa|1|سوء وضع مكتسب في الجفن",
  "9A04|Acquired disorders of eyelashes|adnexa|1|اضطرابات مكتسبة في الأهداب",
  "9A05|Movement disorders of eyelid|adnexa|1|اضطرابات حركية في الجفن",
  "9A06|Certain specified disorders of eyelid|adnexa|1|اضطرابات محددة أخرى في الجفن",
  "9A21|Orbital infection|adnexa|1|عدوى في الحجاج",
  "9A22|Orbital inflammation|adnexa|1|التهاب في الحجاج",
  "9A20|Displacement of eyeball|adnexa|1|انزياح المقلة",

  // ---- Conjunctiva --------------------------------------------------------
  "9A60|Conjunctivitis|conjunctiva|1|التهاب الملتحمة",
  "9A61|Certain specified disorders of conjunctiva|conjunctiva|1|اضطرابات محددة أخرى في الملتحمة",
  "9A62|Mucous membrane pemphigoid with ocular involvement|conjunctiva|1|الفقعان الغشائي المخاطي بمشاركة عينية",

  // ---- Cornea -------------------------------------------------------------
  "9A70|Hereditary corneal dystrophies|cornea|1|الحثل القرني الوراثي",
  "9A71|Infectious keratitis|cornea|1|التهاب القرنية المعدي",
  "9A72|Traumatic keratitis|cornea|1|التهاب القرنية الرضي",
  "9A73|Exposure keratitis|cornea|1|التهاب القرنية التعرضي",
  "9A74|Neurotrophic keratitis|cornea|1|التهاب القرنية الحثل عصبي المنشأ",
  "9A75|Autoimmune keratitis|cornea|1|التهاب القرنية المناعي الذاتي",
  "9A76|Corneal ulcer|cornea|1|قرحة القرنية",
  "9A77|Corneal scars or opacities|cornea|1|ندبات أو عتامات القرنية",
  "9A78|Certain specified disorders of cornea|cornea|1|اضطرابات محددة أخرى في القرنية",
  "9A79|Keratoconjunctivitis sicca|cornea|1|التهاب القرنية والملتحمة الجاف",
  "9A7A|Corneal abscess|cornea|1|خراج القرنية",
  "9A7B|Sclerosing keratitis|cornea|1|التهاب القرنية المصلب",

  // ---- Anterior uvea ------------------------------------------------------
  "9A93|Adhesions or disruptions of iris or ciliary body|anterior_uvea|1|التصاقات أو تمزقات في القزحية أو الجسم الهدبي",
  "9A96|Anterior uveitis|anterior_uvea|1|التهاب العنبية الأمامي",
  "9C20|Panuveitis|anterior_uvea|1|التهاب العنبية الشامل",
  "9C21|Endophthalmitis|anterior_uvea|1|التهاب باطن المقلة",

  // ---- Lens ---------------------------------------------------------------
  "9B10|Cataract|lens|1|الساد (الكتاراكت)",
  "9B10.21|Diabetic cataract|lens|1|الساد السكري",
  "9B11|Certain specified disorders of lens|lens|1|اضطرابات محددة أخرى في العدسة",

  // ---- Retina and vitreous ------------------------------------------------
  "9B70|Inherited retinal dystrophies|retina|1|الحثل الشبكي الوراثي",
  "9B71.0|Diabetic retinopathy|retina|1|الاعتلال الشبكي السكري",
  "9B71.1|Hypertensive retinopathy|retina|1|الاعتلال الشبكي الناتج عن فرط ضغط الدم",
  "9B71.3|Retinopathy of prematurity|retina|1|اعتلال الشبكية عند الأطفال الخدّج",
  "9B72|Inflammatory diseases of the retina|retina|1|أمراض التهابية في الشبكية",
  "9B73|Retinal detachments or breaks|retina|1|انفصال الشبكية أو فتوقها",
  "9B74|Retinal vascular occlusions|retina|1|انسدادات وعائية في الشبكية",
  "9B76|Degenerative high myopia|retina|1|قصر النظر العالي التنكسي",
  "9B78|Certain specified retinal disorders|retina|1|اضطرابات محددة أخرى في الشبكية",
  "9B83|Vitreous haemorrhage|retina|1|نزف في الجسم الزجاجي",

  // ---- Macula -------------------------------------------------------------
  "9B75.0|Age-related macular degeneration|macula|1|التنكس البقعي المرتبط بالعمر",
  "9B75.1|Non-traumatic macular hole|macula|1|ثقبة البقعة غير الرضية",
  "9B75.2|Central serous chorioretinopathy|macula|1|اعتلال المشيمية والشبكية المصلّي المركزي",
  "9B75.3|Macular telangiectasia|macula|1|توسع الشعيرات البقعي",

  // ---- Glaucoma -----------------------------------------------------------
  "9C60|Glaucoma suspect|glaucoma|1|مشتبه glaucoma — اشتباه الزرق",
  "9C61|Glaucoma|glaucoma|1|الزرق (الجلوكوما)",
  "9C61.0|Primary open-angle glaucoma|glaucoma|1|الزرق الأولي مفتوح الزاوية",
  "9C61.1|Primary angle closure or angle closure glaucoma|glaucoma|1|انغلاق الزاوية الأولي أو الزرق انغلاقي الزاوية",
  "9C61.2|Secondary open-angle glaucoma|glaucoma|1|الزرق الثانوي مفتوح الزاوية",
  "9C61.3|Secondary angle closure glaucoma|glaucoma|1|الزرق الثانوي انغلاقي الزاوية",

  // ---- Optic nerve and visual pathways ------------------------------------
  "9C40.0|Infectious optic neuropathy|optic_nerve|1|اعتلال عصبي بصري معدي",
  "9C40.1|Optic neuritis|optic_nerve|1|التهاب العصب البصري",
  "9C40.2|Neuroretinitis|optic_nerve|1|التهاب الشبكية والعصب",
  "9C40.4|Ischaemic optic neuropathy|optic_nerve|1|اعتلال عصبي بصري إقفاري",
  "9C40.5|Compressive optic neuropathy|optic_nerve|1|اعتلال عصبي بصري انضغاطي",
  "9C40.7|Traumatic optic neuropathy|optic_nerve|1|اعتلال عصبي بصري رضي",
  "9C40.8|Hereditary optic neuropathy|optic_nerve|1|اعتلال عصبي بصري وراثي",
  "9C40.9|Glaucomatous optic neuropathy|optic_nerve|1|اعتلال عصبي بصري زَرَقي",
  "9C40.A|Optic disc swelling|optic_nerve|1|تورم القرص البصري",
  "9C40.B|Optic atrophy|optic_nerve|1|ضمور العصب البصري",
  "9C41|Disorder of optic chiasm|optic_nerve|1|اضطراب في التصالب البصري",
  "9C42|Disorder of post chiasmal visual pathways|optic_nerve|1|اضطراب في السبل البصرية بعد التصالب",
  "9C43|Disorder of visual cortex|optic_nerve|1|اضطراب في القشرة البصرية",

  // ---- Strabismus and motility -------------------------------------------
  "9C80|Non paralytic strabismus|motility|1|الحَوَل غير الشللي",
  "9C81|Ocular motor nerve palsies|motility|1|شلل الأعصاب المحركة للعين",
  "9C83|Disorders of binocular movement|motility|1|اضطرابات الحركة المزدوجة للعينين",
  "9C84|Nystagmus|motility|1|الرأرأة",

  // ---- Refraction ---------------------------------------------------------
  "9D00|Disorders of refraction|refraction|1|اضطرابات الانكسار",
  "9D01|Disorders of accommodation|refraction|1|اضطرابات التكيّف",

  // ---- Post-procedural ----------------------------------------------------
  "9D20|Bullous aphakic keratopathy following cataract surgery|postprocedural|1|اعتلال قرني فقاعي بلا عدسة بعد جراحة الساد",
  "9D23|Conjunctival blebitis after glaucoma surgery|postprocedural|1|التهاب الفقاعة الملتحمية بعد جراحة الزرق",
  "9D25|Glaucoma due to ocular surgery or laser|postprocedural|1|زرق ناتج عن جراحة أو ليزر في العين",

  // ---- Vision impairment --------------------------------------------------
  "9D40|Impairment of visual acuity|vision|1|اختلال حدة البصر",
  "9D41|Impairment of visual field|vision|1|اختلال المجال البصري",
  "9D90|Vision impairment including blindness|vision|1|اختلال البصر بما في ذلك العمى",

  // ---- Trauma (Chapter 22) ------------------------------------------------
  "NA06|Injury of eye or orbit|trauma|1|إصابة العين أو الحجاج",
  "NA06.0|Eyelid trauma|trauma|1|رض الجفن",
  "NA06.8|Traumatic injury to eyeball|trauma|1|إصابة رضية للمقلة",
  "NA06.9|Contusion of eyeball or orbital tissues|trauma|1|رضّ المقلة أو أنسجة الحجاج",
  "ND70.2|Foreign body in multiple parts of external eye|trauma|1|جسم أجنبي في عدة أجزاء من العين الخارجية",

  // ---- Congenital (Chapter 20) -------------------------------------------
  "LA10|Structural developmental anomalies of ocular globes|congenital|1|تشوهات نمو بنيوية في المقلة",
  "LA12|Structural developmental anomalies of lens or zonula|congenital|1|تشوهات نمو بنيوية في العدسة أو النطاق",
];

// Coding instructions that apply to a specific entry, in WHO's structural terms.
const CODING_NOTE = {
  "9B10":
    "Cataract is coded here. The type and density are recorded in the note's lens fields; where the cataract is diabetic, 9B10.21 is selected and the diabetes itself is coded separately as its own diagnosis.",
  "9B71.0":
    "Diabetic retinopathy is coded here. The severity level (no retinopathy to proliferative disease) and macular oedema are structured fields in the note — WHO does not carry them in this stem, and the code is never rewritten to imply a level.",
  "9B71.3":
    "Retinopathy of prematurity is coded here. Zone, stage, extent and plus disease are recorded in the note's ROP fields using the ICROP3 terminology; they are never folded into the code.",
  "9C61.0":
    "Primary open-angle glaucoma is coded here. Glaucoma stage, target IOP and progression are structured fields in the note; a glaucoma suspect is coded 9C60 instead, never 9C61.",
  "9C61.1":
    "Primary angle closure and angle-closure glaucoma share this category. The note's gonioscopy and acute-presentation fields document which state applies; an acute attack is a note field, not a different code.",
  "9C60":
    "A glaucoma suspect is coded here — never as glaucoma. Suspicion is not a diagnosis, and the note records what made the patient a suspect and what is being monitored.",
  "9C21":
    "Endophthalmitis is coded here and always records the setting (post-operative, post-injection or endogenous) in the note, together with the sampling and treatment. It is never coded as a post-procedural complication instead of the infection itself.",
  "9D00":
    "Disorders of refraction are coded here. The refraction itself belongs in the note's refraction fields; myopia, hyperopia and astigmatism are documented there and are not separate invented codes.",
  "9C40.A":
    "Optic disc swelling is coded here as the finding. The cause (raised intracranial pressure, ischaemia, inflammation, infiltration) is documented in the note and, wherever established, coded as its own diagnosis.",
  "NA06":
    "Injury of eye or orbit is coded here, with the BETT terminology and the Ocular Trauma Score inputs recorded in the note's trauma fields.",
  "9D25":
    "Glaucoma caused by surgery or laser is coded here. Where the glaucoma is a known complication of an eye operation, the post-procedural nature is what this entry records — the operation itself is documented in the note.",
  "9A76":
    "A corneal ulcer is coded here. The infectious organism, where identified, and the contact-lens association are recorded in the note; the ulcer is never coded as a keratitis subtype on assumption.",
};

export const OPHTH_ICD11 = RAW.map((row) => {
  const [code, display, domain, primaryFlag, arabic] = row.split("|");
  const isPrimary = primaryFlag === "1";
  const domainLabel = OPHTH_ICD11_DOMAINS[domain] || domain;
  return {
    code,
    display,
    domain,
    domainLabel,
    primary: isPrimary,
    category: "medical_condition",
    release: OPHTH_ICD11_MMS.release,
    version: `${OPHTH_ICD11_MMS.label} ${OPHTH_ICD11_MMS.release}`,
    source: OPHTH_ICD11_MMS.source_url,
    browser: OPHTH_ICD11_MMS.browser_url,
    verified_date: OPHTH_ICD11_MMS.retrieved,
    precise: true,
    specificity: code.includes(".")
      ? "Subcategory — most specific"
      : "Block (stem) — select a subcategory when known",
    aliases: [display, domainLabel, arabic].filter(Boolean).join(" "),
    coding_note: CODING_NOTE[code] || "",
    definition: isPrimary
      ? `WHO ICD-11 MMS category in ${domainLabel}. Inclusion and exclusion notes are not reproduced here — confirm the exact category against the WHO browser before relying on a residual (…Y / …Z) code.`
      : `WHO carries this as a NON-primary tabulation entry. Document it together with the underlying condition, never instead of it. Category in ${domainLabel}.`,
    arabic,
  };
});

// Only the domains one note can code, so an operative note never suggests a
// refraction code and a test report never suggests a trauma code.
export const ophthalmologyCatalogFor = (domains) => {
  const wanted = Array.isArray(domains) ? domains : [];
  if (!wanted.length) return OPHTH_ICD11;
  return OPHTH_ICD11.filter((i) => wanted.includes(i.domain));
};