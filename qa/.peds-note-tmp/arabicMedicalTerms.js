// Arabic medical autocomplete system for Patient Registration.
// Recognizes common Arabic words, phrases, and patient-friendly descriptions,
// and maps them to standardized medical terminology:
//   - term.ar : standardized Arabic term shown to the patient in the Patient Portal
//   - term.en : standardized English term stored on the record for the Doctor Portal
// Matching works on normalized Arabic text (diacritics/alef variants removed),
// so "السكرى", "السكري" and "السكري" all match داء السكري → Diabetes Mellitus.

export const ARABIC_REGEX = /[\u0600-\u06FF]/;

export function normalizeArabicText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "") // diacritics + tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

// Diseases / medical conditions
export const AR_CONDITION_TERMS = [
  { ar: "داء السكري", en: "Diabetes Mellitus", aliases: ["سكري", "السكري", "السكر", "سكر", "السكرى", "داء السكر"] },
  { ar: "ارتفاع ضغط الدم", en: "Hypertension", aliases: ["ضغط", "الضغط", "ضغط الدم", "ضغط عالي", "ارتفاع الضغط", "ضغط مرتفع"] },
  { ar: "فرط كوليسترول الدم", en: "Hypercholesterolemia", aliases: ["كوليسترول", "الكوليسترول", "دهون الدم", "ارتفاع الدهون", "كولسترول"] },
  { ar: "الربو", en: "Asthma", aliases: ["ربو", "حساسية الصدر", "ضيق النفس التحسسي", "الربو الشعبي"] },
  { ar: "الانسداد الرئوي المزمن", en: "Chronic Obstructive Pulmonary Disease (COPD)", aliases: ["انسداد رئوي", "نفاخة الرئة", "التهاب شعبي مزمن", "كحة المدخنين"] },
  { ar: "الذبحة الصدرية", en: "Angina Pectoris", aliases: ["ذبحة", "الم الصدر", "الم في الصدر", "ضيق في الصدر"] },
  { ar: "احتشاء عضلة القلب", en: "Myocardial Infarction", aliases: ["جلطة القلب", "احتشاء", "الجلطة القلبية", "سكتة قلبية"] },
  { ar: "قصور القلب", en: "Heart Failure", aliases: ["هبوط القلب", "فشل القلب", "ضعف عضلة القلب", "قصور القلب"] },
  { ar: "الرجفان الأذيني", en: "Atrial Fibrillation", aliases: ["رجفان", "خفقان القلب", "خفقان", "عدم انتظام ضربات القلب", "ارتجاف"] },
  { ar: "السكتة الدماغية", en: "Stroke", aliases: ["سكتة", "جلطة الدماغ", "جلطة المخ", "السكتة الدماغيه", "شلل نصفي"] },
  { ar: "الصرع", en: "Epilepsy", aliases: ["صرع", "تشنجات", "التشنج", "مرض الصرع", "نوبة صرع"] },
  { ar: "الصداع النصفي", en: "Migraine", aliases: ["شقيقة", "صداع نصفي", "الصداع النصبى", "الصداع النصفي"] },
  { ar: "قصور الغدة الدرقية", en: "Hypothyroidism", aliases: ["خمول الغدة", "الغدة الدرقية", "تخاذل الغدة", "كسل الغدة", "غدة خاملة"] },
  { ar: "فرط نشاط الغدة الدرقية", en: "Hyperthyroidism", aliases: ["فرط نشاط الغدة", "نشاط الغدة", "فرط الغدة"] },
  { ar: "فقر الدم", en: "Anemia", aliases: ["انيميا", "الانيميا", "فقر دم", "نقص الهيموغلوبين", "نقص الدم"] },
  { ar: "الثلاسيميا", en: "Thalassemia", aliases: ["ثلاسيميا", "انيميا البحر المتوسط", "الثلاسيميا"] },
  { ar: "مرض الكلى المزمن", en: "Chronic Kidney Disease", aliases: ["كلى", "الكلى", "فشل كلوي", "قصور الكلى", "ضعف الكلى", "مرض الكلى"] },
  { ar: "حصى الكلى", en: "Kidney Stones", aliases: ["حصى", "حصوات", "حصوة", "حصوة الكلى", "حصى الكلى", "حصوات الكلى"] },
  { ar: "التهاب المسالك البولية", en: "Urinary Tract Infection", aliases: ["مسالك", "التهاب بولي", "التهاب المجاري البولية", "حرقة البول", "التهاب المسالك"] },
  { ar: "حصى المرارة", en: "Gallstones", aliases: ["مرارة", "حصوة المرارة", "حصى المرارة", "حصوات المرارة", "الم المرارة"] },
  { ar: "ارتجاع المريء", en: "Gastroesophageal Reflux Disease (GERD)", aliases: ["ارتجاع", "حرقة المعدة", "حموضة", "الحموضة", "ارتجاع حامض"] },
  { ar: "التهاب المعدة", en: "Gastritis", aliases: ["معدة", "المعدة", "التهاب في المعدة", "قرحة المعدة الحموضة"] },
  { ar: "قرحة المعدة", en: "Peptic Ulcer", aliases: ["قرحة", "قرحه", "قرحة المعده"] },
  { ar: "التهاب الكبد الفيروسي", en: "Viral Hepatitis", aliases: ["كبد", "الكبد", "التهاب الكبد", "فيروس الكبد", "وباء الكبد", "التهاب كبدي"] },
  { ar: "تليف الكبد", en: "Liver Cirrhosis", aliases: ["تليف", "تشمع الكبد", "تليف كبدي"] },
  { ar: "التهاب المفاصل", en: "Arthritis", aliases: ["مفاصل", "روماتيزم", "الم المفاصل", "التهاب المفاصل الروماتويدي", "روماتيزم المفاصل"] },
  { ar: "التهاب المفاصل الروماتويدي", en: "Rheumatoid Arthritis", aliases: ["روماتويد", "روماتويد", "التهاب رثوي"] },
  { ar: "النقرس", en: "Gout", aliases: ["نقرس", "داء الملوك", "حمض اليوريك", "ارتفاع حمض اليوريك", "ملوكة"] },
  { ar: "هشاشة العظام", en: "Osteoporosis", aliases: ["هشاشة", "هشاشه", "ترقق العظام", "هشاشة العظام"] },
  { ar: "الذئبة الحمامية الجهازية", en: "Systemic Lupus Erythematosus", aliases: ["ذئبة", "لوبيس", "الذئبة", "الذئبه"] },
  { ar: "حساسية الأنف التحسسية", en: "Allergic Rhinitis", aliases: ["حساسية انف", "حساسية الغبار", "حساسية موسمية", "حساسية الطلع"] },
  { ar: "تكيس المبايض", en: "Polycystic Ovary Syndrome", aliases: ["تكيس", "مبايض", "تكيس المبيض", "تكيس المبايض"] },
  { ar: "سرطان الثدي", en: "Breast Cancer", aliases: ["ثدي", "ورم الثدي", "سرطان الثدى", "سرطان الثدي"] },
  { ar: "سرطان القولون", en: "Colon Cancer", aliases: ["قولون", "ورم القولون", "سرطان القولون", "اورام القولون"] },
  { ar: "سرطان الرئة", en: "Lung Cancer", aliases: ["رئة", "ورم الرئة", "سرطان الرئه", "سرطان الرئة"] },
  { ar: "سرطان البروستاتا", en: "Prostate Cancer", aliases: ["بروستات", "ورم البروستاتا", "البروستاتا"] },
  { ar: "اللمفوما", en: "Lymphoma", aliases: ["لمفوما", "الاورام اللمفاوية", "ورم لمفاوي"] },
  { ar: "الاكتئاب", en: "Depression", aliases: ["اكتئاب", "الاكتئاب", "مزاج سيء", "ضيق نفسي"] },
  { ar: "اضطراب القلق", en: "Anxiety Disorder", aliases: ["قلق", "التوتر", "قلق مستمر", "التوتر العصبي"] },
  { ar: "ارتفاع ضغط العين", en: "Glaucoma", aliases: ["جلوكوما", "المياه الزرقاء", "المياه الزرقاء في العين", "ضغط العين"] },
  { ar: "الساد", en: "Cataract", aliases: ["المياه البيضاء", "مياه بيضاء", "الساد", "عتامة العين"] },
  { ar: "البواسير", en: "Hemorrhoids", aliases: ["بواسير", "البواسير", "بواسير الشرج"] },
  { ar: "دوالي الساقين", en: "Varicose Veins", aliases: ["دوالي", "الدوالي", "دوالي الرجل"] },
  { ar: "السل", en: "Tuberculosis", aliases: ["سل", "تدرن", "السل الرئوي"] },
  { ar: "التهاب اللوزتين", en: "Tonsillitis", aliases: ["لوز", "لوزتين", "التهاب اللوز", "اللوزتين"] },
  { ar: "شلل الأطفال", en: "Poliomyelitis", aliases: ["شلل الاطفال", "شلل اطفال", "البوليو"] },
  { ar: "العنقز", en: "Chickenpox", aliases: ["عنقز", "الجدري المائي", "جدري مائي", "حماق"] },
];

// Surgeries / procedures
export const AR_SURGERY_TERMS = [
  { ar: "استئصال الزائدة الدودية", en: "Appendectomy", aliases: ["الزايدة", "الزائدة", "عملية الزايدة", "عملية الزايدة الدودية", "زائدة", "استئصال الزايدة", "الزايدة الدودية"] },
  { ar: "استئصال المرارة", en: "Cholecystectomy", aliases: ["مرارة", "عملية المرارة", "استئصال المراره", "ازالة المرارة", "حصوة المرارة عملية"] },
  { ar: "إصلاح الفتق الجراحي", en: "Hernia Repair", aliases: ["فتق", "الفتق", "عملية الفتق", "اصلاح فتق", "فتق اربي"] },
  { ar: "الولادة القيصرية", en: "Cesarean Section", aliases: ["قيصرية", "عملية قيصرية", "الولادة القيصرية", "ولادة قيصرية", "كسرية"] },
  { ar: "استئصال الرحم", en: "Hysterectomy", aliases: ["رحم", "عملية الرحم", "استئصال الرحم", "ازالة الرحم", "عملية استئصال الرحم"] },
  { ar: "استئصال الثدي", en: "Mastectomy", aliases: ["عملية الثدي", "استئصال الثدي", "ازالة الثدي", "استئصال الثدى"] },
  { ar: "جراحة تحويل الشريان التاجي", en: "Coronary Artery Bypass Grafting", aliases: ["قلب مفتوح", "عملية قلب مفتوح", "القلب المفتوح", "تحويل شريان", "جراحة القلب المفتوح"] },
  { ar: "تركيب دعامة الشريان التاجي", en: "Coronary Stent Placement", aliases: ["دعامة", "ستنت", "تركيب دعامة", "دعامة قلبية", "قسطرة قلبية", "قسطرة"] },
  { ar: "تنظير البطن", en: "Laparoscopy", aliases: ["منظار", "تنظير", "عملية المنظار", "تنظير البطن", "جراحة المنظار"] },
  { ar: "استئصال البواسير", en: "Hemorrhoidectomy", aliases: ["بواسير", "عملية بواسير", "ازالة البواسير", "ربط البواسير"] },
  { ar: "استئصال الغدة الدرقية", en: "Thyroidectomy", aliases: ["غدة", "عملية الغدة", "استئصال الغدة", "ازالة الغدة الدرقية", "عملية درقية"] },
  { ar: "استئصال الكلية", en: "Nephrectomy", aliases: ["عملية الكلى", "استئصال كلية", "ازالة الكلى", "ازالة كلية", "استئصال الكلي"] },
  { ar: "تفتيت حصى الكلى", en: "Lithotripsy", aliases: ["تفتيت", "تفتيت الحصى", "تفتيت حصى", "تفتيت الحصوات", "ليز الكلى"] },
  { ar: "استئصال الورم", en: "Tumor Resection", aliases: ["ورم", "عملية ورم", "ازالة ورم", "استئصال الاورام", "ازالة الورم"] },
  { ar: "جراحة الساد", en: "Cataract Surgery", aliases: ["مياه بيضاء", "عملية العين", "المياه البيضاء", "عملية المياه البيضاء", "عدسة العين"] },
  { ar: "إعادة بناء الرباط الصليبي", en: "ACL Reconstruction", aliases: ["الرباط الصليبي", "صليبي", "عملية الرباط", "رباط صليبي", "الرباط الامامي"] },
  { ar: "تنظير المفصل", en: "Arthroscopy", aliases: ["منظار المفاصل", "تنظير مفاصل", "عملية منظار الركبة", "منظار الركبة"] },
  { ar: "استئصال اللوزتين", en: "Tonsillectomy", aliases: ["لوز", "لوزتين", "عملية اللوز", "ازالة اللوزتين", "استئصال اللوز"] },
  { ar: "جراحة دوالي الساقين", en: "Varicose Vein Surgery", aliases: ["دوالي", "عملية الدوالي", "ازالة الدوالي", "ربط الدوالي"] },
  { ar: "استئصال البروستاتا", en: "Prostatectomy", aliases: ["بروستات", "عملية البروستاتا", "ازالة البروستاتا", "استئصال البروستات"] },
  { ar: "زراعة الكلى", en: "Kidney Transplant", aliases: ["زراعة", "زراعة كلى", "عملية زراعة", "زرع الكلى", "زراعة الكلى"] },
  { ar: "تثبيت الكسور بالصفائح والمسامير", en: "Fracture Fixation", aliases: ["كسر", "عملية الكسر", "مسامير", "شرائح", "تثبيت كسر", "جبيرة عملية"] },
  { ar: "استئصال الأمعاء", en: "Bowel Resection", aliases: ["امعاء", "عملية امعاء", "ازالة جزء من الامعاء", "استئصال القولون", "قطع الامعاء"] },
  { ar: "جراحة الشبكية", en: "Retinal Surgery", aliases: ["شبكية", "عملية الشبكية", "انفصال الشبكية", "تثبيت الشبكية"] },
  { ar: "جراحة القلب للأطفال", en: "Congenital Heart Defect Repair", aliases: ["عيوب القلب الخلقية", "عملية قلب لطفل", "ثقب في القلب", "ثقب القلب"] },
];

// Returns up to `limit` terms matching the patient's input. Matches against the
// standardized Arabic term, the English term, and every alias, on normalized
// text. Exact > startsWith > includes > alias-contained-in-input.
export function suggestTerms(input, terms, limit = 5) {
  const q = normalizeArabicText(input);
  if (!q || q.length < 2) return [];
  const scored = [];
  for (const term of terms) {
    let score = 0;
    for (const alias of [term.ar, term.en, ...term.aliases]) {
      const a = normalizeArabicText(alias);
      if (!a) continue;
      if (a === q) score = Math.max(score, 100);
      else if (a.startsWith(q)) score = Math.max(score, 80);
      else if (a.includes(q)) score = Math.max(score, 60);
      else if (q.includes(a) && a.length >= 3) score = Math.max(score, 50);
    }
    if (score > 0) scored.push({ term, score });
  }
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, limit).map((s) => s.term);
}