// Arabic display layer for the respiratory documentation blocks.
// DISPLAY ONLY: the values stored on a note are the English option strings, the
// English field labels and the English section headings, so an Arabic view never
// rewrites a saved record and an English export is unchanged. Anything not held
// here falls back to English rather than being guessed.
export const PULM_AR_TITLES = {
  "Respiratory History, Exposure & Risk Profile": "التاريخ التنفسي والتعرض وملف المخاطر",
  "Symptom Assessment": "تقييم الأعراض",
  "Respiratory Examination": "الفحص التنفسي",
  "Inhaler and Device Review": "مراجعة البخاخ والجهاز",
  "Exacerbation History, Action Plan & Self-Management": "تاريخ الانتكاسات وخطة العمل والرعاية الذاتية",
  "Oxygen and Ventilatory Support": "الأكسجين والدعم التهويوي",
  "Lung Function Interpretation (as documented)": "تفسير وظائف الرئة (كما هو موثّق)",
  "Asthma Assessment": "تقييم الربو",
  "COPD Assessment": "تقييم الانسداد الرئوي المزمن",
  "Interstitial Lung Disease Review": "مراجعة أمراض الرئة الخلالية",
  "Bronchiectasis Review": "مراجعة توسّع القصبات",
  "Sleep-Disordered Breathing Assessment": "تقييم اضطرابات التنفس أثناء النوم",
  "Tuberculosis Documentation": "توثيق السل",
  "Pleural Disease and Drain Documentation": "توثيق أمراض الجنب والمصرف الصدري",
  "Suspected Pulmonary Embolism Pathway": "مسار الاشتباه بالانصمام الرئوي",
  "Structured Presenting Complaints & History of Present Illness": "الشكاوى المنظّمة وتاريخ المرض الحالي",
  "Cough and Sputum Assessment": "تقييم السعال والبلغم",
  "Dyspnoea Assessment (mMRC and Borg)": "تقييم ضيق النفس (mMRC وBorg)",
  "Previous Respiratory Illness, Admissions and Ventilation History": "تاريخ المرض التنفسي السابق والدخولات والتهوية",
  "Respiratory Medication, Allergy and Comorbidity Review": "مراجعة الأدوية التنفسية والحساسية والأمراض المصاحبة",
  "Vital Signs, Oxygen Saturation and Oxygen Delivery": "العلامات الحيوية وتشبّع الأكسجين وإعطاء الأكسجين",
  "Education, Prevention and Follow-Up": "التثقيف والوقاية والمتابعة",
  "COPD — Diagnostic Confirmation (GOLD)": "الانسداد الرئوي المزمن — تأكيد التشخيص (GOLD)",
  "COPD — Symptom Burden, Exacerbation Risk and GOLD ABE Group": "الانسداد الرئوي المزمن — عبء الأعراض وخطر الانتكاس ومجموعة GOLD ABE",
  "COPD — Structured Treatment Plan and Exacerbation Prevention": "الانسداد الرئوي المزمن — خطة العلاج المنظّمة والوقاية من الانتكاس",
  "Asthma — Diagnostic Evidence of Variable Airflow Limitation (GINA)": "الربو — الأدلة التشخيصية على تغيّر محدودية تدفق الهواء (GINA)",
  "Asthma — Symptom Control, Exacerbation Risk and Severity (GINA)": "الربو — سيطرة الأعراض وخطر الانتكاس والشدة (GINA)",
  "Asthma — ICS-Containing Treatment, Step Assessment and Action Plan": "الربو — العلاج المحتوي على الكورتيكوستيرويد المستنشق وتقييم الدرجة وخطة العمل",
  "Acute Exacerbation — Severity and Physiological Assessment": "الانتكاسة الحادة — تقييم الشدة والوظائف الفسيولوجية",
  "Acute Exacerbation — Treatment and Response to Treatment": "الانتكاسة الحادة — العلاج والاستجابة له",
  "Respiratory Emergency — Recognition and Immediate Actions": "طارئ تنفسي — التعرّف والإجراءات الفورية",
  "Time-Critical Respiratory Conditions — Recognition and Definitive Management": "حالات تنفسية حرجة زمنياً — التعرّف والتدبير النهائي",
  "Respiratory Support and Ventilation Documented": "الدعم التنفسي والتهوية (موثّق)",
  "Longitudinal Review — Symptoms, Exacerbations and Lung Function Trend": "المراجعة الطولية — الأعراض والانتكاسات واتجاه وظائف الرئة",
  "Longitudinal Review — Treatment Response, Adherence and Self-Management": "المراجعة الطولية — الاستجابة للعلاج والالتزام والرعاية الذاتية",
  "Longitudinal Review — Vaccination, Smoking Cessation and Rehabilitation": "المراجعة الطولية — التطعيم والإقلاع عن التدخين والتأهيل",
  "Multidisciplinary Referral — Specialty, Reason, Urgency and Clinical Question": "الإحالة متعددة التخصصات — التخصص والسبب والاستعجال والسؤال السريري",
  "Multidisciplinary Discussion and Shared Decisions Recorded": "المناقشة متعددة التخصصات والقرارات المشتركة (موثّقة)",
};

// Note-level headings and interface copy for the same blocks.
export const PULM_AR_CHROME = {
  "Respiratory Assessment & Coding": "التقييم التنفسي والترميز",
  "Documented Respiratory Scores": "المقاييس التنفسية الموثّقة",
  "Advisory Documentation Prompts": "تنبيهات استرشادية للتوثيق",
  "Guideline Basis of This Note": "الأساس الإرشادي لهذه الملاحظة",
  "Structured Investigations": "الفحوصات المنظّمة",
  "ICD-11 Coded Diagnoses": "التشخيصات المرموزة بـ ICD-11",
  "Select…": "اختر…",
  "Select device…": "اختر الجهاز…",
  "Not calculable yet — enter the values it needs above.": "غير قابل للحساب بعد — أدخل القيم اللازمة أعلاه.",
  "calculated, not entered": "محسوب، وليس مُدخلاً",
  "Not documented": "غير موثّق",
  // Calculated-value notes: the arithmetic is shown for review only and never
  // replaces the figure the clinician documented.
  "Cigarettes per day ÷ 20 × years smoked. Shown for review; the documented pack-year figure above is never overwritten by it.":
    "عدد السجائر يومياً ÷ 20 × عدد سنوات التدخين. يُعرض للمراجعة فقط، ولا يستبدل أبداً رقم سنوات العلبة الموثّق أعلاه.",
  "FEV1 ÷ FVC. Shown so the reported ratio can be checked; the reported value above is never overwritten by it.":
    "FEV1 ÷ FVC. يُعرض للتحقق من النسبة المبلّغ عنها، ولا يستبدل أبداً القيمة المبلّغ عنها أعلاه.",
  "The grade bands as GOLD states them. Shown for review only: the grade recorded above is the clinician's, and no grade is written into the record by the app.":
    "فئات الدرجة كما يحدّدها GOLD. تُعرض للمراجعة فقط: الدرجة المسجّلة أعلاه هي درجة الطبيب، والتطبيق لا يكتب أي درجة في السجل.",
  "E: two or more moderate exacerbations, or one needing emergency attendance or admission. Otherwise A where CAT < 20 and mMRC 0–1, B where CAT ≥ 20 or mMRC ≥ 2. Shown for review; the group recorded above is the clinician's.":
    "E: انتكاستان متوسطتان أو أكثر، أو انتكاسة واحدة استدعت مراجعة الطوارئ أو الدخول. وإلا فـ A حيث CAT < 20 وmMRC 0–1، وB حيث CAT ≥ 20 أو mMRC ≥ 2. يُعرض للمراجعة فقط، والمجموعة المسجّلة أعلاه هي مجموعة الطبيب.",
  "The percentage change GINA uses to describe bronchodilator responsiveness, shown beside the absolute change so both can be read together. Shown for review; the reported values above are never overwritten.":
    "النسبة المئوية للتغيّر التي يستخدمها GINA لوصف الاستجابة للموسّع القصبي، تُعرض بجانب التغيّر المطلق ليُقرأ الاثنان معاً. تُعرض للمراجعة فقط، ولا تُستبدل القيم المبلّغ عنها أعلاه.",
  "GINA: none of the four criteria present = well controlled; one or two = partly controlled; three or four = uncontrolled. Shown for review; the control level recorded below is the clinician's.":
    "GINA: عدم وجود أي من المعايير الأربعة = مسيطر عليه جيداً؛ معيار أو اثنان = مسيطر عليه جزئياً؛ ثلاثة أو أربعة = غير مسيطر عليه. يُعرض للمراجعة فقط، ومستوى السيطرة المسجّل أدناه هو مستوى الطبيب.",
  // Validated instrument names. The questionnaire wording itself is deliberately
  // left in its validated English form and is never machine-translated here.
  "Asthma Control Test (ACT)": "اختبار سيطرة الربو (ACT)",
  "COPD Assessment Test (CAT)": "اختبار تقييم الانسداد الرئوي المزمن (CAT)",
  "modified MRC Dyspnoea Scale (mMRC)": "مقياس MRC المعدّل لضيق النفس (mMRC)",
  "CURB-65 — pneumonia severity": "CURB-65 — شدة الالتهاب الرئوي",
  "Wells score — pulmonary embolism": "مقياس Wells — الانصمام الرئوي",
  "PERC — pulmonary embolism rule-out criteria": "PERC — معايير استبعاد الانصمام الرئوي",
  "STOP-BANG — obstructive sleep apnoea screening": "STOP-BANG — تحرّي انقطاع النفس الانسدادي النومي",
};