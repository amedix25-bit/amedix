// Gastroenterology / Hepatology ICD-11 MMS reference catalogue.
//
// Every code and display term below was read from the ICD-11 MMS tabulation
// (release 2026-01) and copied verbatim, including WHO's own wording — Chapter
// 13 "Diseases of the digestive system", with viral hepatitis read from Chapter
// 01 and the polyposis syndrome entry from Chapter 02. Nothing is generated or
// guessed: an entry that was not read from the tabulation is NOT offered, and a
// clinician can always add a code from the WHO browser — such an entry is stored
// as REVIEW REQUIRED until it is checked against the catalogue.
//
// Scope — the digestive content a Gastroenterology / Hepatology note documents:
//   oesophagus · stomach & duodenum · small intestine · large intestine ·
//   inflammatory bowel disease · functional GI disorders · diverticular disease ·
//   intestinal ischaemia · anal canal · liver (parenchymal, toxic, autoimmune,
//   vascular, fibrotic) · viral hepatitis · gallbladder & biliary · pancreas
//
// Deliberately NOT included, and stated rather than silently omitted:
//  - Digestive NEOPLASMS (oesophageal, gastric, colorectal, pancreatic,
//    hepatocellular carcinoma). They sit in Chapter 02 and are coded by the
//    oncology service; a lesion-level neoplasm code must be taken from the WHO
//    browser so an incomplete code is never applied to a patient. Polyposis
//    syndrome (2E92.40) is included because the Endoscopy / Colonoscopy note
//    documents it directly.
//  - Postcoordination detail (cirrhosis + aetiology, IBD + extent and severity,
//    pancreatitis + severity). WHO carries these as postcoordination axes; the
//    note records them in its own structured fields instead of rewriting the
//    stem code, and the coding instruction for DB93 says so.
//  - Symptom-level codes (abdominal pain, jaundice, dyspepsia): a symptom is
//    documented as a symptom in the note and never coded as a disease.
//
// A code is never a diagnosis. The field records role, status, mapping state and
// the clinician's documented basis, and only a clinician confirms a diagnosis.

export const GASTRO_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  release: "2026-01",
  label: "ICD-11 MMS",
  chapter: "Chapter 13 — Diseases of the digestive system",
  browser_url: "https://icd.who.int/browse/2026-01/mms/en",
  source_url: "https://icd.who.int/browse/2026-01/mms/en",
  retrieved: "2026-10-30",
  read_from:
    "ICD-11 MMS tabulation, release 2026-01 — Chapter 13 (categories and subcategories), Chapter 01 for viral hepatitis, Chapter 02 for polyposis syndrome",
};

export const GASTRO_ICD11_DOMAINS = {
  oesophagus: "Oesophagus",
  stomach_duodenum: "Stomach and duodenum",
  small_intestine: "Small intestine (including coeliac disease and malabsorption)",
  large_intestine: "Large intestine and colon",
  ibd: "Inflammatory bowel disease",
  functional: "Functional gastrointestinal disorders",
  diverticular: "Diverticular disease",
  vascular: "Ischaemic and vascular disorders of the intestine",
  anal: "Anal canal",
  liver: "Liver",
  viral_hepatitis: "Viral hepatitis",
  biliary: "Gallbladder and biliary tract",
  pancreas: "Pancreas",
  neoplasm: "Neoplastic and polyposis conditions",
};

// code | official display term | domain | primary tabulation entry (1 = yes) | Arabic term
const RAW = [
  // ---- Oesophagus ----------------------------------------------------------
  "DA20|Acquired anatomical alterations of the oesophagus|oesophagus|1|تغيّرات تشريحية مكتسبة في المريء",
  "DA20.1|Diverticulum of oesophagus, acquired|oesophagus|1|رَتْج مكتسب في المريء",
  "DA21|Motility disorders of oesophagus|oesophagus|1|اضطرابات حركة المريء",
  "DA22|Gastro-oesophageal reflux disease|oesophagus|1|داء الارتداد المعدي المريئي",
  "DA23|Columnar metaplastic epithelium of the oesophagus|oesophagus|1|تغيرات عمودية في ظهارة المريء (باريت)",
  "DA24|Oesophagitis|oesophagus|1|التهاب المريء",
  "DA25|Oesophageal ulcer|oesophagus|1|قرحة المريء",
  "DA26|Vascular disorders of the oesophagus|oesophagus|1|اضطرابات وعائية في المريء",
  "DA2Z|Diseases of oesophagus, unspecified|oesophagus|1|أمراض المريء غير محددة",

  // ---- Stomach and duodenum ------------------------------------------------
  "DA40.3|Gastric diverticulum|stomach_duodenum|1|رَتْج معدي",
  "DA60|Gastric ulcer|stomach_duodenum|1|قرحة المعدة",
  "DA61|Peptic ulcer, site unspecified|stomach_duodenum|1|قرحة هضمية غير محددة الموقع",
  "DA62|Anastomotic ulcer|stomach_duodenum|1|قرحة المفاغرة",
  "DA63|Duodenal ulcer|stomach_duodenum|1|قرحة الاثنا عشر",
  "DA7Z|Diseases of the stomach or the duodenum, unspecified|stomach_duodenum|1|أمراض المعدة أو الاثنا عشر غير محددة",

  // ---- Small intestine -----------------------------------------------------
  "DA91|Obstruction of small intestine|small_intestine|1|انسداد الأمعاء الدقيقة",
  "DA93|Motility disorders of small intestine|small_intestine|1|اضطرابات حركة الأمعاء الدقيقة",
  "DA94|Noninfectious enteritis or ulcer of small intestine|small_intestine|1|التهاب أو قرحة معوية غير معدية",
  "DA95|Coeliac disease|small_intestine|1|الداء البطني (حساسية القمح)",
  "DA96|Intestinal malabsorption or protein-losing enteropathy|small_intestine|1|سوء الامتصاص المعوي أو اعتلال معوي فاقد للبروتين",
  "DA97|Certain vascular disorders of small intestine|small_intestine|1|اضطرابات وعائية في الأمعاء الدقيقة",
  "DA98|Polyps of small intestine|small_intestine|1|سلائل الأمعاء الدقيقة",
  "DA9Z|Diseases of small intestine, unspecified|small_intestine|1|أمراض الأمعاء الدقيقة غير محددة",

  // ---- Large intestine -----------------------------------------------------
  "DB30|Obstruction of large intestine|large_intestine|1|انسداد القولون",
  "DB32|Motility disorders of large intestine|large_intestine|1|اضطرابات حركة القولون",
  "DB33|Certain noninfectious colitis or proctitis|large_intestine|1|التهاب قولون أو مستقيم غير معدٍ",
  "DB34|Certain vascular disorders of large intestine|large_intestine|1|اضطرابات وعائية في القولون",
  "DB34.0|Angiodysplasia of colon|large_intestine|1|خلل التنسج الوعائي في القولون",
  "DB35|Polyp of large intestine|large_intestine|1|سليلة في القولون",
  "DB36|Certain infections of the large intestine|large_intestine|1|عدوى محددة في القولون",
  "DB3Z|Diseases of large intestine, unspecified|large_intestine|1|أمراض القولون غير محددة",

  // ---- Inflammatory bowel disease -----------------------------------------
  "DD70|Crohn disease|ibd|1|داء كرون",
  "DD70.1|Crohn disease of small intestine|ibd|1|داء كرون في الأمعاء الدقيقة",
  "DD70.4|Crohn disease of anal region|ibd|1|داء كرون في المنطقة الشرجية",
  "DD71|Ulcerative colitis|ibd|1|التهاب القولون التقرحي",
  "DD72|Indeterminate colitis|ibd|1|التهاب القولون غير محدد النوع",
  "DD7Y|Other specified inflammatory bowel diseases|ibd|1|أمراض التهاب معوي أخرى محددة",
  "DD7Z|Inflammatory bowel diseases, unspecified|ibd|1|أمراض التهاب معوي غير محددة",

  // ---- Functional GI disorders --------------------------------------------
  "DD90|Functional oesophageal or gastroduodenal disorders|functional|1|اضطرابات وظيفية في المريء أو المعدة والاثنا عشر",
  "DD91|Irritable bowel syndrome or certain specified functional bowel disorders|functional|1|متلازمة القولون العصبي أو اضطرابات وظيفية محددة في الأمعاء",
  "DD92|Functional anorectal disorders|functional|1|اضطرابات وظيفية في الشرج والمستقيم",
  "DD94|Functional gallbladder disorder|functional|1|اضطراب وظيفي في المرارة",
  "DD95|Functional sphincter of Oddi disorder|functional|1|اضطراب وظيفي في مصرة أودي",
  "DD9Z|Functional gastrointestinal disorders, unspecified|functional|1|اضطرابات هضمية وظيفية غير محددة",

  // ---- Diverticular disease ------------------------------------------------
  "DC80|Diverticulitis of large intestine|diverticular|1|التهاب الرتج في القولون",
  "DC81|Diverticulosis of large intestine|diverticular|1|داء الرتج في القولون",
  "DC82|Diverticulum of large intestine|diverticular|1|رَتْج في القولون",
  "DD1Z|Diverticular disease of intestine, unspecified|diverticular|1|داء الرتج غير محدد",

  // ---- Intestinal ischaemia ------------------------------------------------
  "DD30|Acute vascular disorders of intestine|vascular|1|اضطرابات وعائية حادة في الأمعاء",
  "DD31|Chronic vascular disorders of intestine|vascular|1|اضطرابات وعائية مزمنة في الأمعاء",
  "DD3Z|Ischaemic vascular disorders of intestine, unspecified|vascular|1|اضطرابات وعائية إقفارية في الأمعاء غير محددة",

  // ---- Anal canal ----------------------------------------------------------
  "DB70|Infections of the anal region|anal|1|عدوى في المنطقة الشرجية",
  "DB71|Anal polyp|anal|1|سليلة شرجية",
  "DB72|Certain specified diseases of anal canal|anal|1|أمراض محددة في القناة الشرجية",
  "DB7Z|Diseases of anal canal, unspecified|anal|1|أمراض القناة الشرجية غير محددة",

  // ---- Liver ---------------------------------------------------------------
  "DB90|Infectious liver disease|liver|1|مرض كبدي معدٍ",
  "DB91|Acute or subacute hepatic failure|liver|1|الفشل الكبدي الحاد أو تحت الحاد",
  "DB92|Non-alcoholic fatty liver disease|liver|1|مرض الكبد الدهني غير الكحولي",
  "DB92.1|Non-alcoholic steatohepatitis|liver|1|التهاب الكبد الدهني غير الكحولي",
  "DB93|Hepatic fibrosis or cirrhosis|liver|1|تليّف الكبد أو تشمّع الكبد",
  "DB94|Alcoholic liver disease|liver|1|مرض الكبد الكحولي",
  "DB95|Drug-induced or toxic liver disease|liver|1|مرض كبدي دوائي أو سام",
  "DB96|Autoimmune liver disease|liver|1|مرض كبدي مناعي ذاتي",
  "DB96.0|Autoimmune hepatitis|liver|1|التهاب الكبد المناعي الذاتي",
  "DB97|Certain specified inflammatory liver diseases|liver|1|أمراض كبدية التهابية محددة",
  "DB98|Vascular disorders of the liver|liver|1|اضطرابات وعائية في الكبد",
  "DB99|Certain specified diseases of liver|liver|1|أمراض كبدية محددة أخرى",
  "DB9Z|Diseases of liver, unspecified|liver|1|أمراض الكبد غير محددة",

  // ---- Viral hepatitis (Chapter 01) ---------------------------------------
  "1E50|Acute viral hepatitis|viral_hepatitis|1|التهاب الكبد الفيروسي الحاد",
  "1E51|Chronic viral hepatitis|viral_hepatitis|1|التهاب الكبد الفيروسي المزمن",
  "1E5Z|Viral hepatitis, unspecified|viral_hepatitis|1|التهاب الكبد الفيروسي غير محدد",

  // ---- Gallbladder and biliary tract --------------------------------------
  "DC10|Acquired anatomical alterations of gallbladder or bile ducts|biliary|1|تغيّرات تشريحية مكتسبة في المرارة أو الأقنية الصفراوية",
  "DC11|Cholelithiasis|biliary|1|حصى المرارة",
  "DC12|Cholecystitis|biliary|1|التهاب المرارة",
  "DC13|Cholangitis|biliary|1|التهاب الأقنية الصفراوية",
  "DC14|Certain specified biliary diseases|biliary|1|أمراض صفراوية محددة",
  "DC1Z|Diseases of gallbladder or biliary tract, unspecified|biliary|1|أمراض المرارة أو الأقنية الصفراوية غير محددة",

  // ---- Pancreas ------------------------------------------------------------
  "DC30|Cystic diseases of the pancreas|pancreas|1|أمراض كيسية في البنكرياس",
  "DC31|Acute pancreatitis|pancreas|1|التهاب البنكرياس الحاد",
  "DC32|Chronic pancreatitis|pancreas|1|التهاب البنكرياس المزمن",
  "DC33|Autoimmune pancreatitis|pancreas|1|التهاب البنكرياس المناعي الذاتي",
  "DC34|Obstructive pancreatitis|pancreas|1|التهاب البنكرياس الانسدادي",
  "DC35|Certain specified diseases of pancreas|pancreas|1|أمراض بنكرياسية محددة",
  "DC3Z|Diseases of pancreas, unspecified|pancreas|1|أمراض البنكرياس غير محددة",

  // ---- Neoplastic / polyposis (Chapter 02, the entry the endoscopy note uses)
  "2E92.40|Polyposis syndrome|neoplasm|1|متلازمة السلائل",
];

// Coding instructions that apply to a specific entry, in WHO's terms.
const CODING_NOTE = {
  DB93: "Cirrhosis is coded here, and the underlying cause (viral hepatitis, alcohol-associated liver disease, metabolic dysfunction-associated steatotic liver disease, autoimmune or biliary disease) is recorded as its own diagnosis — never folded into this code and never inferred from the other entry.",
  DB92:
    "Steatotic liver disease is coded here only when the metabolic aetiology has been documented; where another cause is established, code that cause. Severity (fibrosis stage) is a structured field in the note, not part of the code.",
  DD71:
    "Extent (proctitis / left-sided / extensive) and activity are recorded in the note's disease-activity fields; WHO carries them as postcoordination axes, so the stem code is never rewritten.",
  DD70:
    "Behaviour, extent and perianal involvement are recorded in the note's IBD fields; where the disease is limited to small intestine or the anal region, the corresponding subcategory is selected instead of the stem.",
  "1E51":
    "Chronic viral hepatitis is coded here together with the virus identified in the note. Acute infection is captured under 1E50, and the two are never merged.",
  "DC31":
    "Severity (mild / moderately severe / severe) and fluid-complication status are documented in the note's pancreatitis fields; the code is not altered to carry them.",
  "2E92.40":
    "Polyposis syndromes are hereditary conditions coded here; the individual polyps documented at colonoscopy are findings of the examination, not separate disease codes.",
  DA23:
    "This is the WHO term for columnar-lined (Barrett) oesophagus. Dysplasia, where present, is documented at histology in the note and is not inferred from this code.",
};

export const GASTRO_ICD11 = RAW.map((row) => {
  const [code, display, domain, primaryFlag, arabic] = row.split("|");
  const isPrimary = primaryFlag === "1";
  const domainLabel = GASTRO_ICD11_DOMAINS[domain] || domain;
  return {
    code,
    display,
    domain,
    domainLabel,
    primary: isPrimary,
    category: "medical_condition",
    release: GASTRO_ICD11_MMS.release,
    version: `${GASTRO_ICD11_MMS.label} ${GASTRO_ICD11_MMS.release}`,
    source: GASTRO_ICD11_MMS.source_url,
    browser: GASTRO_ICD11_MMS.browser_url,
    verified_date: GASTRO_ICD11_MMS.retrieved,
    precise: true,
    specificity: code.includes(".")
      ? "Subcategory — most specific"
      : "Block (stem) — select a subcategory when known",
    aliases: [display, domainLabel, arabic].filter(Boolean).join(" "),
    coding_note: CODING_NOTE[code] || "",
    definition: isPrimary
      ? `WHO ICD-11 MMS category in ${domainLabel}. Inclusion and exclusion notes are not reproduced here — confirm the exact category against the WHO browser before relying on a residual (…Y / …Z) code.`
      : `WHO carries this as a NON-primary tabulation entry. Document it together with the underlying condition, never instead of it. Category in ${domainLabel}.`,
  };
});

// Only the domains one note can code, so a colonoscopy note never suggests a
// liver code and an ERCP note never suggests a coeliac code.
export const gastroenterologyCatalogFor = (domains) => {
  const wanted = Array.isArray(domains) ? domains : [];
  if (!wanted.length) return GASTRO_ICD11;
  return GASTRO_ICD11.filter((i) => wanted.includes(i.domain));
};

export const GASTRO_ICD11_COUNT = GASTRO_ICD11.length;