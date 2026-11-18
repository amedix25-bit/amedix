import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const LANG_STORAGE_KEY = "amedix_patient_lang";

// Arabic translations for the Patient Portal. Keys are the English strings used
// in the components — t() falls back to the English key when no entry exists.
// "CIN" is intentionally NOT translated: it is the patient's unique identifier
// and always stays exactly as CIN.
const AR = {
  // Condition catalog during registration
  "Browse conditions by specialty": "تصفح الأمراض حسب التخصص",
  "Browse by specialty": "تصفح حسب التخصص",
  "Select every condition that applies to you. You can search in Arabic or English, and mark each one as current or historical.": "اختر كل حالة تنطبق عليك. يمكنك البحث بالعربية أو الإنجليزية، وتحديد كل حالة كحالية أو سابقة.",
  "conditions": "حالة",
  "selected": "محددة",
  "conditions across": "حالة موزعة على",
  "specialties": "تخصصًا",
  "Search a disease or condition (Arabic or English)": "ابحث عن مرض أو حالة (بالعربية أو الإنجليزية)",
  "No matching condition. Choose the closest specialty and use “Other – please specify”.": "لا توجد حالة مطابقة. اختر التخصص الأقرب واستخدم «أخرى – يرجى التحديد».",
  "Other – please specify": "أخرى – يرجى التحديد",
  "Current": "حالية",
  "Historical": "سابقة",
  "Tap the Current / Historical tag on a selected condition to change it.": "اضغط على وسم «حالية / سابقة» لتغييرها.",
  "Add conditions": "إضافة حالات",
  "Already added": "مضافة مسبقًا",
  "Searchable in Arabic and English — select several at once.": "قابل للبحث بالعربية والإنجليزية — اختر عدة حالات معًا.",
  // Sidebar navigation
  "Home": "الرئيسية",
  "My Health": "صحتي",
  "Appointments": "المواعيد",
  "My Medical Record": "ملفي الطبي",
  "Doctors' Visits & Consultations": "زيارات الأطباء والاستشارات",
  // Hospitals & Doctors directory
  "Hospitals & Doctors": "المستشفيات والأطباء",
  "AMedix Hospitals": "مستشفيات AMedix",
  "Hospitals registered and approved on AMedix": "المستشفيات المسجلة والمعتمدة على AMedix",
  "Search by hospital name, city or address": "ابحث باسم المستشفى أو المدينة أو العنوان",
  "No hospitals match your search.": "لا توجد مستشفيات مطابقة لبحثك.",
  "See All Hospitals": "عرض جميع المستشفيات",
  "Show Fewer Hospitals": "عرض مستشفيات أقل",
  "Find a Doctor": "ابحث عن طبيب",
  "Verified AMedix physicians across all hospitals": "أطباء موثّقون في AMedix من جميع المستشفيات",
  "Search doctors by name": "ابحث عن الأطباء بالاسم",
  "All specialties": "جميع التخصصات",
  "No doctors match your search.": "لا يوجد أطباء مطابقون لبحثك.",
  "See All Doctors": "عرض جميع الأطباء",
  "Show Fewer Doctors": "عرض أطباء أقل",
  "View Doctors": "عرض الأطباء",
  "View Profile": "عرض الملف الشخصي",
  "Location not listed": "الموقع غير مدرج",
  "Operating hours not listed": "ساعات العمل غير مدرجة",
  "1 doctor": "طبيب واحد",
  "{count} doctors": "{count} طبيباً",
  "1 doctor at this hospital": "طبيب واحد في هذا المستشفى",
  "{count} doctors at this hospital": "{count} طبيباً في هذا المستشفى",
  "No doctors match your search at this hospital.": "لا يوجد أطباء مطابقون لبحثك في هذا المستشفى.",
  "Back to Hospitals & Doctors": "العودة إلى المستشفيات والأطباء",
  "Loading hospitals and doctors...": "جارٍ تحميل المستشفيات والأطباء...",
  "The directory could not be loaded.": "تعذر تحميل الدليل.",
  "Professional Profile": "الملف المهني",
  "Loading profile...": "جارٍ تحميل الملف...",
  "Verified AMedix physician": "طبيب موثّق في AMedix",
  "About": "نبذة",
  "Qualifications & Credentials": "المؤهلات والشهادات",
  "Achievements & Experience": "الإنجازات والخبرة",
  "Hospital Affiliations": "الارتباطات بالمستشفيات",
  "This physician shares additional profile details only within the AMedix professional network.": "هذا الطبيب يشارك تفاصيل إضافية عن ملفه داخل شبكة AMedix المهنية فقط.",
  "This profile could not be opened.": "تعذر فتح هذا الملف.",
  "Medical Documents": "المستندات الطبية",
  "Medical History & Conditions": "التاريخ المرضي والحالات",
  "Lab Tests & Results": "التحاليل والنتائج",
  "X-rays & Scans": "الأشعة والتصوير",
  "Medications & Prescriptions": "الأدوية والوصفات",
  "Profile & Settings": "الملف الشخصي والإعدادات",
  "Personal Information": "المعلومات الشخصية",
  "Choose Your Language": "اختر لغتك",
  "Log Out": "تسجيل الخروج",
  "Laboratory": "المختبر",
  "My Lab Results": "نتائج التحاليل",
  "Imaging": "التصوير الطبي",
  "Documents": "المستندات",
  "Drugs": "الأدوية",
  "Advertisement": "الإعلانات",
  "Offers from AMedix partner pharmacies": "عروض من الصيدليات الشريكة في AMedix",
  "Your current and past medications, dose reminders and adherence": "أدويتك الحالية والسابقة، وتذكيرات الجرعات، ومتابعة الالتزام",
  "Medications": "الأدوية",
  "Access & Privacy": "الوصول والخصوصية",
  "Profile": "الملف الشخصي",
  "Patient": "مريض",
  "Log out": "تسجيل الخروج",
  "Welcome,": "أهلاً،",
  "Patient Portal": "بوابة المريض",
  "Your personal health portal with AMedix": "بوابتك الصحية الشخصية مع AMedix",
  "View Card": "عرض البطاقة",
  "Manage Appointment": "إدارة الموعد",
  "Book Appointment": "حجز موعد",
  "View Lab Results": "عرض نتائج التحاليل",
  "View Imaging": "عرض صور الأشعة",
  "Manage Medications": "إدارة الأدوية",
  "Download Reports": "تنزيل التقارير",
  "Health Summary": "الملخص الصحي",
  "Diagnoses & Conditions": "التشخيصات والحالات المرضية",
  "Surgeries & Procedures": "العمليات والإجراءات",
  "Vaccinations": "التطعيمات",
  "Visit Summaries": "ملخصات الزيارات",
  "Reports & Documents": "التقارير والمستندات",
  "Imaging & Scans": "الأشعة والتصوير",
  "Quick Access": "الوصول السريع",
  "Overview": "نظرة عامة",
  "View All": "عرض الكل",
  "Libya": "ليبيا",
  "Known Conditions": "الحالات المرضية المعروفة",
  "Recent Activity": "النشاط الأخير",
  "Lab Tests": "التحاليل",
  "Messages": "الرسائل",
  "No upcoming appointment": "لا يوجد موعد قادم",
  "No recent activity": "لا يوجد نشاط حديث",
  // Recent Activity items
  "New radiology request": "طلب أشعة جديد",
  "New radiology report": "تقرير أشعة جديد",
  "New prescription": "وصفة طبية جديدة",
  "New lab request": "طلب تحاليل جديد",
  "New lab report": "تقرير تحاليل جديد",
  "{count} total": "{count} إجمالاً",

  // Common actions
  "Search": "بحث",
  "Save": "حفظ",
  "Cancel": "إلغاء",
  "Add": "إضافة",
  "Delete": "حذف",
  "View": "عرض",
  "Close": "إغلاق",
  "Back": "رجوع",
  "Next": "التالي",
  "Continue": "متابعة",
  "Edit": "تعديل",
  "Download": "تنزيل",
  "Select": "اختر",
  "Accept": "قبول",
  "Decline": "رفض",
  "Confirm": "تأكيد",
  "Yes, Confirm": "نعم، تأكيد",
  "Yes, Decline": "نعم، رفض",
  "Change": "تغيير",
  "Sent": "تم الإرسال",
  "Send": "إرسال",
  "Today": "اليوم",
  "Yesterday": "أمس",
  "Loading...": "جارٍ التحميل...",
  "Doctor": "الطبيب",
  "Radiologist": "أخصائي الأشعة",
  "Name": "الاسم",
  "Phone": "الهاتف",
  "Date": "التاريخ",
  "Time": "الوقت",
  "Location": "الموقع",
  "Appointment": "الموعد",
  "Reason": "السبب",
  "Ref:": "مرجع:",
  "Requested by Dr.": "طلبها الدكتور ",
  "Imaging order by Dr.": "طلب تصوير من الدكتور ",
  "Attending doctor": "الطبيب المعالج",
  "Started": "بدأ في",
  "Unknown": "غير معروف",
  "Not specified": "غير محدد",
  "Other": "أخرى",
  "{age} years": "{age} سنة",

  // Overview
  "My CIN": "رقم الـ CIN الخاص بي",
  "Verified Patient": "مريض مُوثّق",
  "Your permanent Clinical Identification Number — unique to you.": "رقم الـ CIN الدائم الخاص بك — فريد من نوعه.",
  "Show QR Code": "عرض رمز QR",
  "Lab Requests": "طلبات التحاليل",
  "Personal Information": "المعلومات الشخصية",
  "Medical Information": "المعلومات الطبية",
  "Full Name": "الاسم الكامل",
  "Date of Birth": "تاريخ الميلاد",
  "Age": "العمر",
  "Sex": "الجنس",
  "CIN": "CIN",
  "Emergency Contact Name": "اسم جهة الاتصال للطوارئ",
  "Emergency Contact Phone": "هاتف جهة الاتصال للطوارئ",
  "Known Case Of": "الحالات المرضية المعروفة",
  "Current Medication": "الأدوية الحالية",
  "Allergies": "الحساسية",
  "Smoking Status": "حالة التدخين",
  "Alcohol Use": "تعاطي الكحول",
  "Pregnancy Status": "حالة الحمل",
  "Male": "ذكر",
  "Female": "أنثى",
  "Pregnant": "حامل",
  "Not pregnant": "غير حامل",
  "Not applicable": "لا ينطبق",
  "EDD": "موعد الولادة المتوقع",
  "Never smoked": "لم يدخّن أبداً",
  "Former smoker": "مدخّن سابق",
  "Current smoker": "مدخّن حالي",
  "None": "لا شيء",
  "Occasional": "عرضي",
  "Regular": "منتظم",
  "Former drinker": "متناول سابق للكحول",
  "Show this to your doctor": "اعرض هذا لطبيبك",
  "Doctors can find your record by scanning this code or searching your CIN.":
    "يمكن للأطباء العثور على سجلك الطبي بمسح هذا الرمز أو البحث برقم الـ CIN الخاص بك.",

  // My Health
  "Your medical history was recorded at registration and is locked. Contact your doctor or an administrator for any corrections or updates.":
    "تم تسجيل تاريخك الطبي عند التسجيل وهو مُقفل. تواصل مع طبيبك أو مع مسؤول لإجراء أي تصحيحات أو تحديثات.",
  "Demographics": "البيانات الأساسية",
  "No known conditions were recorded at registration.": "لم يتم تسجيل أي حالات مرضية معروفة عند التسجيل.",
  "Current Diagnosis": "التشخيص الحالي",
  "No active diagnosis recorded. Diagnoses from your clinical visits will appear here.":
    "لا يوجد تشخيص حالي مسجل. ستظهر هنا التشخيصات الناتجة عن زياراتك الطبية.",
  "Diagnosed on": "تم التشخيص بتاريخ",
  "Past Medical History": "التاريخ الطبي السابق",
  "No past medical history was recorded at registration.": "لم يتم تسجيل أي تاريخ طبي سابق عند التسجيل.",
  "Past Surgical History": "التاريخ الجراحي السابق",
  "No previous surgeries were recorded.": "لم يتم تسجيل أي عمليات جراحية سابقة.",
  "Reason / Indication": "السبب / الاستطباب",
  "Complications": "المضاعفات",
  "Recovery / Outcome": "التعافي / النتيجة",
  "Hospitalization Duration": "مدة الإقامة في المستشفى",
  "Anesthesia": "التخدير",
  "Anesthesia History": "تاريخ التخدير",
  "Anesthesia Complications": "مضاعفات التخدير",
  "Other Procedures": "إجراءات أخرى",
  "Implants / Medical Devices": "الزرعات / الأجهزة الطبية",
  "Blood Transfusion History": "تاريخ نقل الدم",
  "Number of Transfusions": "عدد مرات نقل الدم",
  "Blood / Component Type": "نوع الدم / المكونات",
  "Amount": "الكمية",
  "Timing (relative to surgery)": "التوقيت (بالنسبة للعملية)",
  "Reactions / Complications": "التفاعلات / المضاعفات",
  "Add Medication": "إضافة دواء",
  "Medication name *": "اسم الدواء *",
  "e.g. Metformin": "مثال: Metformin",
  "Start date": "تاريخ البدء",
  "Save Medication": "حفظ الدواء",
  "No medications were recorded.": "لم يتم تسجيل أي أدوية.",
  "Doctor-Prescribed": "بواسطة الطبيب",
  "Patient-Reported": "بحسب المريض",
  "PRN — as needed": "عند الحاجة",
  "Completed": "مكتمل",
  "Stopped": "موقوف",
  "Restart": "إعادة التشغيل",
  "No allergies were recorded.": "لم يتم تسجيل أي حساسية.",
  "Drug": "دوائية",
  "Food": "غذائية",
  "Environmental": "بيئية",
  "Mild": "خفيفة",
  "Moderate": "متوسطة",
  "Severe": "شديدة",
  "Lifestyle and Pregnancy": "نمط الحياة والحمل",
  "Other Substance Use": "استخدام مواد أخرى",
  "Gestational Age": "عمر الحمل",
  "Estimated Due Date": "موعد الولادة المتوقع",
  "Pregnancy History": "تاريخ الحمل",
  "Medical History — Encounters": "التاريخ الطبي — الزيارات",
  "Patient Seen": "تمت رؤية المريض",
  "Scheduled": "مجدول",
  "Cancelled": "ملغي",
  "Attended": "تم الحضور",
  "No-show": "لم يحضر",
  "Pending": "قيد الانتظار",
  "Requested": "مطلوب",

  // Medications
  "Update Your Medication Information": "حدّث معلومات أدويتك",
  "Please add your current medication information to keep your medical record up to date.":
    "يرجى إضافة معلومات أدويتك الحالية لإبقاء سجلك الطبي محدثاً.",
  "Add Medication Information": "إضافة معلومات دواء",
  "I'm not taking any medications": "لا أتناول أي أدوية",
  "Loading medications...": "جارٍ تحميل الأدوية...",
  "No current medications.": "لا توجد أدوية حالية.",
  "Medication History": "سجل الأدوية",
  "Active": "نشط",
  "Discontinued": "موقوف",
  "Dose": "الجرعة",
  "Route of Administration": "طريقة الإعطاء",
  "Frequency": "عدد المرات",
  "Max Frequency": "الحد الأقصى للتكرار",
  "Meal": "الوجبات",
  "Duration": "المدة",
  "End Date": "تاريخ الانتهاء",
  "Indication": "الاستطباب",
  "Doctor's Notes": "ملاحظات الطبيب",
  "Notes": "ملاحظات",
  "Special Instructions": "تعليمات خاصة",
  "Edit Medication": "تعديل الدواء",
  "Drug Name *": "اسم الدواء *",
  "e.g. 500 mg": "مثال: 500 ملغ",
  "e.g. Twice daily": "مثال: مرتين يومياً",
  "Before or After Meal": "قبل أو بعد الوجبة",
  "Duration (if known)": "المدة (إن كانت معروفة)",
  "e.g. 14 days": "مثال: 14 يوماً",
  "Additional Notes": "ملاحظات إضافية",
  "Save Changes": "حفظ التغييرات",
  "Before meals": "قبل الوجبات",
  "After meals": "بعد الوجبات",
  "With meals": "مع الوجبات",
  "Anytime": "في أي وقت",
  "Oral": "عن طريق الفم",
  "Intravenous": "وريدي",
  "Intramuscular": "عضلي",
  "Subcutaneous": "تح الجلد",
  "Topical": "موضعي",
  "Inhalation": "استنشاق",
  "Rectal": "شرجي",

  // Appointments
  "No appointments yet": "لا توجد مواعيد بعد",
  "You confirmed": "لقد أكدت الحضور",
  "You declined": "لقد رفضت الموعد",
  "Are you sure you want to confirm this appointment?": "هل أنت متأكد من تأكيد هذا الموعد؟",
  "Are you sure you want to decline this appointment?": "هل أنت متأكد من رفض هذا الموعد؟",

  // Laboratory
  "No laboratory requests": "لا توجد طلبات تحاليل",
  "Lab Request": "طلب تحاليل",
  "Indication:": "الاستطباب:",
  "Instructions:": "التعليمات:",
  "Access Granted": "تم منح الوصول",
  "Laboratory:": "المختبر:",
  "Lab ID:": "رقم المختبر:",
  "Date Authorized:": "تاريخ التفويض:",
  "View result file": "عرض ملف النتائج",
  "Download request PDF": "تنزيل نموذج الطلب (PDF)",
  "REQUESTED": "مطلوب",
  "AUTHORIZED / SENT TO LABORATORY": "مُفوَّض / تم إرساله إلى المختبر",
  "PENDING": "قيد الانتظار",
  "RESULTS AVAILABLE": "النتائج متاحة",
  "Hematology": "أمراض الدم",
  "Biochemistry": "الكيمياء الحيوية",
  "Lipid Profile": "دهون الدم",
  "Thyroid Function Tests": "وظائف الغدة الدرقية",
  "Cardiac Tests": "اختبارات القلب",
  "Iron Studies": "دراسات الحديد",
  "Vitamins & Minerals": "الفيتامينات والمعادن",
  "Inflammatory & Autoimmune Tests": "اختبارات الالتهاب والمناعة الذاتية",
  "Hormonal Tests": "الاختبارات الهرمونية",
  "Infectious Disease / Serology": "الأمراض المعدية / الأمصال",
  "Urine Tests": "اختبارات البول",
  "Microbiology": "الأحياء الدقيقة",
  "Stool Tests": "اختبارات البراز",
  "Special Tests": "اختبارات خاصة",
  "Urinalysis": "تحليل البول",
  "Complete Blood Count (CBC)": "تعداد الدم الكامل (CBC)",
  "Blood Glucose": "سكر الدم",
  "HbA1c": "السكر التراكمي (HbA1c)",
  "Liver Function Tests": "وظائف الكبد",
  "Kidney Function Tests": "وظائف الكلى",
  "Vitamin D": "فيتامين د",
  "Coagulation Profile": "تخثر الدم",
  "Add Lab Result": "إضافة نتيجة تحليل",
  "Submit Laboratory Result": "إرسال نتيجة تحليل",
  "Test Type *": "نوع التحليل *",
  "Select test type": "اختر نوع التحليل",
  "Test Type (specify) *": "نوع التحليل (حدد) *",
  "e.g. Stool Analysis": "مثال: تحليل البراز",
  "Date of Test *": "تاريخ التحليل *",
  "Laboratory Name *": "اسم المختبر *",
  "e.g. Tripoli Medical Laboratory": "مثال: مختبر طرابلس الطبي",
  "Laboratory Report (PDF or image) *": "تقرير المختبر (PDF أو صورة) *",
  "Choose PDF or image...": "اختر ملف PDF أو صورة...",
  "Select the test type.": "يرجى اختيار نوع التحليل.",
  "Enter the test type.": "يرجى إدخال نوع التحليل.",
  "Upload your laboratory report (PDF or image).": "يرجى رفع تقرير المختبر (PDF أو صورة).",
  "Your laboratory result was submitted and is now part of your medical record.":
    "تم إرسال نتيجة التحليل وأصبحت الآن جزءاً من سجلك الطبي.",
  "Could not submit the result. Please try again.": "تعذّر إرسال النتيجة. يرجى المحاولة مرة أخرى.",
  "Submit Result": "إرسال النتيجة",
  "No lab results submitted yet": "لم يتم إرسال أي نتائج تحاليل بعد",
  "Results you submit will be listed here, organized by date.": "النتائج التي ترسلها ستظهر هنا مرتبة حسب التاريخ.",
  "Test date:": "تاريخ التحليل:",
  "Patient-submitted": "مُرسلة من المريض",
  "Submitted": "تم الإرسال",
  "View Lab Result": "عرض نتيجة التحليل",
  "Select Laboratory": "اختر المختبر",
  "The laboratory only receives this request after you select it and explicitly allow access.":
    "لن يستلم المختبر هذا الطلب إلا بعد اختياره والسماح له بالوصول صراحةً.",
  "Search by laboratory name or A&M Lab Number...": "ابحث باسم المختبر أو رقم A&M Lab...",
  "Searching laboratories...": "جارٍ البحث عن المختبرات...",
  'No registered laboratories match "{query}".': 'لا توجد مختبرات مسجلة تطابق "{query}".',
  "Allow Laboratory to View Request": "السماح للمختبر بعرض الطلب",
  "Allow Laboratory Access?": "السماح بوصول المختبر؟",
  "You are giving {lab} (A&M Lab Number {number}) permission to view this laboratory request and the information required to perform the requested tests.":
    "أنت تمنح {lab} (برقم مختبر A&M: {number}) إذناً بعرض طلب التحاليل هذا والمعلومات المطلوبة لإجراء التحاليل المطلوبة.",
  "Yes, Allow": "نعم، اسمح",
  "Laboratory search failed.": "فشل البحث عن المختبرات.",
  "Failed to authorize the laboratory.": "تعذّر تفويض المختبر.",
  "Registered": "مسجل",
  "A&M Lab Number:": "رقم مختبر A&M:",

  // Imaging / Radiology
  "No imaging requests": "لا توجد طلبات تصوير",
  "X-Ray": "أشعة سينية",
  "CT": "أشعة مقطعية",
  "MRI": "رنين مغناطيسي",
  "Ultrasound": "موجات فوق صوتية",
  "Mammography": "تصوير الثدي الشعاعي",
  "View Request": "عرض الطلب",
  "View Results": "عرض النتائج",
  "Back to Imaging": "العودة إلى التصوير الطبي",
  "Loading results...": "جارٍ تحميل النتائج...",
  "No results yet": "لا توجد نتائج بعد",
  "The radiologist's finalized report PDF and study images will appear here once submitted.":
    "سيظهر هنا تقرير أخصائي الأشعة النهائي (PDF) وصور الفحص بمجرد إرسالها.",
  "Radiologist:": "أخصائي الأشعة:",
  "Open Report (PDF)": "فتح التقرير (PDF)",
  "View Image": "عرض الصورة",
  "Send to Doctor": "إرسال إلى الطبيب",
  "Finalized": "تم الإنهاء بتاريخ",
  "Radiology Requests": "طلبات الأشعة",
  "Per-request authorizations: a radiologist you accept can view only that one imaging request — never the rest of your record.":
    "تفويض لكل طلب على حدة: أخصائي الأشعة الذي توافق عليه يمكنه عرض طلب التصوير ذلك فقط — وليس أي شيء آخر من سجلك أبداً.",
  "No radiology requests": "لا توجد طلبات أشعة",
  "You'll be notified when a radiologist requests access to one of your imaging requests.":
    "سيتم إشعارك عندما يطلب أخصائي أشعة الوصول إلى أحد طلبات التصوير الخاصة بك.",
  "Radiologist requesting access:": "أخصائي الأشعة الطالب للوصول:",
  "{name} can view this imaging request only": "يمكن لـ {name} عرض طلب التصوير هذا فقط",
  "{name} cannot view this request": "لا يمكن لـ {name} عرض هذا الطلب",
  "Accepted": "مقبول",
  "Declined": "مرفوض",

  // Access & Privacy
  "Your medical record is private": "سجلك الطبي خاص وآمن",
  "Doctors can only access your records with your approval. Use the eye icon to suspend or restore a doctor's access at any time — the doctor stays in your list.":
    "لا يمكن للأطباء الوصول إلى سجلاتك إلا بموافقتك. استخدم أيقونة العين لإيقاف وصول أي طبيب أو استعادته في أي وقت — يبقى الطبيب في قائمتك.",
  "Pending Access Requests": "طلبات الوصول قيد الانتظار",
  "Requested on": "تاريخ الطلب",
  "Doctor Access": "وصول الأطباء",
  "No doctors currently have access": "لا يوجد أطباء لديهم وصول حالياً",
  "Access Suspended": "الوصول موقوف",
  "Access granted on": "تم منح الوصول بتاريخ",
  "Turn off this doctor's access": "إيقاف وصول هذا الطبيب",
  "Restore this doctor's access": "استعادة وصول هذا الطبيب",
  "This doctor can currently view your medical information.": "يمكن لهذا الطبيب حالياً عرض معلوماتك الطبية.",
  "This doctor cannot view your medical information until you turn access back on.":
    "لا يمكن لهذا الطبيب عرض معلوماتك الطبية حتى تقوم بتشغيل الوصول مرة أخرى.",
  "Remove Doctor": "إزالة الطبيب",
  "Declined Requests": "الطلبات المرفوضة",
  "Declined on": "تاريخ الرفض",
  "Re-accept Access": "إعادة قبول الوصول",
  "Radiologist Access": "وصول أخصائيي الأشعة",
  "Pending Radiologist Requests": "طلبات أخصائيي الأشعة قيد الانتظار",
  "No radiologists currently have access": "لا يوجد أخصائيو أشعة لديهم وصول حالياً",
  "Turn off this radiologist's access": "إيقاف وصول أخصائي الأشعة هذا",
  "Restore this radiologist's access": "استعادة وصول أخصائي الأشعة هذا",
  "Remove Radiologist": "إزالة أخصائي الأشعة",
  "Declined Radiologist Requests": "طلبات أخصائيي الأشعة المرفوضة",
  "Access Log": "سجل الوصول",
  "Access granted": "تم منح الوصول",
  "Access suspended": "تم إيقاف الوصول",
  "Access restored": "تمت استعادة الوصول",
  "Access declined": "تم رفض الوصول",
  "Access removed": "تمت إزالة الوصول",
  "No access changes recorded yet.": "لم يتم تسجيل أي تغييرات على الوصول بعد.",
  "Send to Doctor:": "إرسال إلى الطبيب:",
  "Choose a doctor to share this report with. The eye icon suspends or restores a doctor's access.":
    "اختر طبيباً لمشاركة هذا التقرير معه. أيقونة العين توقف وصول الطبيب أو تستعيده.",
  "Loading your doctors...": "جارٍ تحميل أطبائك...",
  "No doctors currently have access to your record": "لا يوجد أطباء لديهم وصول إلى سجلك حالياً",
  "Has access to your record": "لديه وصول إلى سجلك",
  "Access suspended — turn the eye back on to send": "الوصول موقوف — أعد تشغيل العين للإرسال",

  // Profile
  "Identity": "الهوية",
  "CIN (permanent)": "الـ CIN (دائم)",
  "Identification Number": "رقم الهوية",
  "Contact & Medical Details": "التواصل والتفاصيل الطبية",
  "Blood type": "فصيلة الدم",
  "Address": "العنوان",
  "Your medical history (conditions, medications, allergies, surgeries, lifestyle) was recorded at registration and is locked. Contact your doctor or an administrator for any corrections.":
    "تم تسجيل تاريخك الطبي (الأمراض، الأدوية، الحساسية، العمليات، نمط الحياة) عند التسجيل وهو مُقفل. تواصل مع طبيبك أو مع مسؤول لإجراء أي تصحيحات.",
  "Emergency Contact": "جهة الاتصال للطوارئ",
  "Relationship": "صلة القرابة",
  "Saved": "تم الحفظ",

  // Notifications
  "Notifications": "الإشعارات",
  "Updates about your appointments and laboratory tests": "تحديثات حول مواعيدك وتحاليلك الطبية",
  "No notifications yet": "لا توجد إشعارات بعد",
  "View Appointment": "عرض الموعد",
  "Review & Authorize": "المراجعة والتفويض",
  "Upcoming Appointment": "موعد قادم",
  "Appointment Rescheduled": "تمت إعادة جدولة الموعد",
  "Laboratory Results Available": "نتائج المختبر متاحة الآن",
  "New Appointment": "موعد جديد",

  // Documents
  "Insurance Documents": "مستندات التأمين",
  "Vaccination Records": "سجلات التطعيم",
  "Additional Documents": "مستندات إضافية",
  "Loading documents...": "جارٍ تحميل المستندات...",
  "Could not save the picture. Please try again.": "تعذّر حفظ الصورة. يرجى المحاولة مرة أخرى.",
  "Medical Insurance Card": "بطاقة التأمين الطبي",
  "Photograph the front and back of your medical insurance card. Saved under Insurance Documents.":
    "صوّر الوجه الأمامي والخلفي لبطاقة تأمينك الطبي. تُحفظ ضمن مستندات التأمين.",
  "Front": "الوجه الأمامي",
  "Back": "الوجه الخلفي",
  "Vaccination Card": "بطاقة التطعيم",
  "Photograph your vaccination card. Saved under Vaccination Records.":
    "صوّر بطاقة التطعيم الخاصة بك. تُحفظ ضمن سجلات التطعيم.",
  "Card": "البطاقة",
  "Medical Reports": "التقارير الطبية",
  "Laboratory Results": "نتائج المختبر",
  "Imaging & Radiology": "التصوير والأشعة",
  "Prescriptions": "الوصفات الطبية",
  "Hospital / Discharge Documents": "مستندات المستشفى والخروج",
  "Surgical & Procedure Records": "سجلات العمليات والإجراءات",
  "Referral Letters": "خطابات التحويل",
  "Pathology / Biopsy Reports": "تقارير الأنسجة / الخزعة",
  "Other Medical Documents": "مستندات طبية أخرى",
  "Document": "مستند",
  "Take a Picture": "التقاط صورة",
  "Delete this document?": "حذف هذا المستند؟",
  '"{title}" will be permanently removed from your documents.': 'سيتم حذف "{title}" نهائياً من مستنداتك.',
  "Delete document": "حذف المستند",
  "Clinical Notes": "الملاحظات السريرية",
  "Switch Portal": "تبديل البوابة",

  // ─── Demographics editing ───
  "Demographics": "البيانات الديموغرافية",
  "Nationality": "الجنسية",
  "Nationality, e.g. Libyan": "الجنسية، مثال: ليبي",
  "Occupation": "المهنة",
  "Occupations": "المهن",
  "Occupation, e.g. Student, Physician": "المهنة، مثال: طالب، طبيب",
  "Add Occupation": "إضافة مهنة",
  "Phone Numbers": "أرقام الهاتف",
  "Add Phone Number": "إضافة رقم هاتف",
  "Primary": "رئيسي",
  "Secondary": "ثانوي",
  "Work": "العمل",
  "Emergency Contacts": "جهات اتصال الطوارئ",
  "Add Emergency Contact": "إضافة جهة اتصال للطوارئ",
  "Remove": "إزالة",

  // ─── Registration: Family History / Marital Status / Pregnancy History ───
  "Family History": "التاريخ العائلي",
  "Diseases or medical conditions that run in your family": "أمراض أو حالات طبية منتشرة في عائلتك",
  "No family history of diseases": "لا يوجد تاريخ عائلي للأمراض",
  "Familial condition": "الحالة العائلية",
  "Family member": "فرد العائلة",
  "Please specify": "يرجى التحديد",
  "Marital Status": "الحالة الزوجية",
  "Married": "متزوجة",
  "Not Married": "غير متزوجة",
  "Pregnancy History": "تاريخ الحمل",
  "Answer about previous pregnancies even if you are not pregnant now.": "أجيبي عن الحمول السابقة حتى لو لم تكوني حاملًا الآن.",
  "Number of pregnancies (Gravida)": "عدد مرات الحمل (Gravida)",
  "Number of births (Para)": "عدد الولادات (Para)",
  "Number of living children": "عدد الأبناء الأحياء",
  "Number of miscarriages/abortions": "عدد مرات الإجهاض / الإسقاط",
  "Number of stillbirths": "عدد حالات موت الجنين",
  "weeks": "أسابيع",

  // ─── Verification Process (registration) ───
  "Verification Process": "عملية التحقق",
  "Birth Certificate": "شهادة الميلاد",
  "Official Identification Document": "وثيقة هوية رسمية",
  "Medical / Professional License Document": "وثيقة الترخيص الطبي / المهني",
  "Medical License Number": "رقم الترخيص الطبي",
  "National ID Number": "الرقم الوطني",
  "Date of Birth": "تاريخ الميلاد",
  "Upload a clear photo or PDF": "ارفع صورة واضحة أو ملف PDF",
  "Change file": "تغيير الملف",
  "Verify": "تحقق",
  "Verifying...": "جارٍ التحقق...",
  "Verified ✓": "تم التحقق ✓",
  "Verification Failed": "فشل التحقق",
  "The information you entered does not match the document. Please correct your information or upload the correct document.": "المعلومات التي أدخلتها لا تطابق الوثيقة. يرجى تصحيح المعلومات أو رفع الوثيقة الصحيحة.",
  "We could not read the document. Please upload a clearer photo or PDF.": "لم نتمكن من قراءة الوثيقة. يرجى رفع صورة أوضح أو ملف PDF.",
  "Verification is required before you can continue.": "التحقق مطلوب قبل المتابعة.",
  "Enter the required information first.": "أدخل المعلومات المطلوبة أولاً.",
  "Something went wrong during verification. Please try again.": "حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.",
  "Your documents are verified securely and stored with your profile.": "يتم التحقق من وثائقك بأمان وتخزينها مع ملفك الشخصي.",
  "Choose one verification method — successfully verifying it verifies your account. The other methods are not required.": "اختر طريقة تحقق واحدة — نجاح التحقق بها يوثّق حسابك، ولا حاجة لاستخدام الطرق الأخرى.",
  "Personal Card": "البطاقة الشخصية",
  "Passport": "جواز السفر",
  "Personal Card Number": "رقم البطاقة الشخصية",
  "Passport Number": "رقم جواز السفر",
  "Front side": "الوجه الأمامي",
  "Back side": "الوجه الخلفي",
  "Upload a clear photo or PDF of the front side": "ارفع صورة أو ملف PDF واضحاً للوجه الأمامي",
  "Upload a clear photo or PDF of the back side": "ارفع صورة أو ملف PDF واضحاً للوجه الخلفي",
  "Upload clear photos of both sides, or one PDF containing both sides": "ارفع صوراً واضحة للوجهين، أو ملف PDF واحداً يحتوي على الوجهين",
  "Upload a clear photo or PDF of the identification page": "ارفع صورة أو ملف PDF واضحاً لصفحة التعريف",
  "One PDF containing both sides": "ملف PDF واحد يحتوي على الوجهين",
  "Please upload the back side of your Personal Card, or upload one PDF containing both sides.": "يرجى رفع الوجه الخلفي للبطاقة الشخصية، أو رفع ملف PDF واحد يحتوي على الوجهين.",
  "The front and back photos do not belong to the same card. Please upload both sides of your Personal Card.": "لا تعود صور الوجه الأمامي والخلفي إلى البطاقة نفسها. يرجى رفع وجهي بطاقتك الشخصية.",
  "Clinical notes saved by your doctors appear here automatically.":
    "تظهر هنا تلقائياً جميع الملاحظات السريرية التي سجلها أطباؤك.",
  "No clinical notes yet": "لا توجد ملاحظات سريرية بعد",
  "View PDF": "عرض PDF",
  "Provisional Diagnosis": "التشخيص المبدئي",
  "Dr.": "د.",
  "Labs": "التحاليل",
  "View Request": "عرض الطلب",
  "View Result": "عرض النتيجة",
  "Laboratory tests your doctors requested, and authorizing laboratories": "التحاليل التي طلبها أطباؤك، وتفويض المختبرات",
  "Laboratory results from your tests": "نتائج التحاليل من تحاليلك",
  "AMedix Partners": "شركاء أميديكس",
  "AMedix Pharmacy Partners": "شركاء صيدليات أميديكس",
  "AMedix Laboratory Partners": "شركاء مختبرات أميديكس",
  "Premium Partner": "شريك مميز",
  "Sponsored": "إعلان ممول",
  "View Details": "عرض التفاصيل",
  "Get Directions": "الحصول على الاتجاهات",
  "Services": "الخدمات",
  "No partner offers at the moment": "لا توجد عروض من الشركاء حالياً",
  "Loading partner offers…": "جارٍ تحميل عروض الشركاء…",
  "Partner offers could not be loaded.": "تعذر تحميل عروض الشركاء.",
  "Try again": "حاول مرة أخرى",
  "Impressions": "مرات الظهور",
  "Detail views": "مشاهدات التفاصيل",
  "Contact clicks": "نقرات التواصل",
  "Direction clicks": "نقرات الاتجاهات",
  "Impressions — last 30 days": "مرات الظهور — آخر 30 يوماً",
  "No impressions recorded yet": "لم تُسجل مرات ظهور بعد",
  "Impressions are counted at most once per advertisement per viewer per day": "تُحتسب مرة الظهور مرة واحدة كحد أقصى لكل إعلان لكل مشاهد يومياً",
  "Advertisement performance": "أداء الإعلان",
  "Premium": "مميز",
  "Standard": "أساسي",
  "impressions": "مرة ظهور",
  "total events": "إجمالي الأحداث",
  "Plan": "الخطة",
  "Status": "الحالة",
  "Next payment": "الدفعة القادمة",
  "Renewal date": "تاريخ التجديد",
  "Scheduled plan change": "تغيير خطة مجدول",
  "effective": "يسري من",
  "WhatsApp": "واتساب",
  "Contact": "تواصل",
  "No prescriptions for this visit": "لا توجد وصفات طبية لهذه الزيارة",
  "No lab requests for this visit": "لا توجد طلبات تحاليل لهذه الزيارة",
  "No imaging requests for this visit": "لا توجد طلبات تصوير لهذه الزيارة",
  "Working Diagnosis": "التشخيص العمل الأولي",
  "Contrast": "مادة التباين",
  "Dosage": "الجرعة",
  "Refills": "إعادة الصرف",
  "Quantity": "الكمية",

  // ─── Messages from doctors (patient channel) ───
  "Messages from Doctors": "رسائل من الأطباء",
  "One-way messages sent to you by your treating doctors": "رسائل باتجاه واحد يرسلها إليك أطباؤك المعالجون",
  "unread": "غير مقروءة",
  "This is a one-way message channel. Replies are not available and messages cannot be edited. For anything urgent, contact your hospital or your doctor's clinic directly — this is not an emergency service.":
    "هذه قناة رسائل باتجاه واحد: لا يمكن الرد على الرسائل ولا تعديلها. في الحالات العاجلة تواصل مباشرة مع مستشفاك أو عيادة طبيبك — هذه ليست خدمة طوارئ.",
  "No messages from your doctors yet": "لا توجد رسائل من أطبائك بعد",
  "When a doctor sends you instructions or a follow-up, it will appear here":
    "عندما يرسل إليك الطبيب تعليمات أو متابعة، ستظهر هنا",
  "Select a message": "اختر رسالة",
  "You will see the doctor's name, specialty, hospital and the date and time of each message.":
    "سترى اسم الطبيب وتخصصه والمستشفى وتاريخ ووقت كل رسالة.",
  "Follow-up instructions": "تعليمات المتابعة",
  "Appointment reminder": "تذكير بموعد",
  "Medication instructions": "تعليمات الأدوية",
  "Test / imaging preparation": "التحضير للتحليل / التصوير",
  "Post-consultation care": "الرعاية بعد الاستشارة",
  "Approved educational material": "مواد تعليمية معتمدة",
  "General message": "رسالة عامة",
  "Message": "رسالة",
  "One-way": "اتجاه واحد",
  "Announcement": "إعلان",
  "Correction": "تصحيح",
  "Read": "تمت القراءة",
  "Delivered": "تم التسليم",
  "No messages yet": "لا توجد رسائل بعد",
  "Pending": "قيد الانتظار",
  "In Progress": "قيد المعالجة",
  "Not available": "غير متاح",
  "Access denied": "تم رفض الوصول",
  "Activity & access trail": "سجل النشاط والوصول",
  "This is a one-way message from your doctor. Replies are not available.":
    "هذه رسالة باتجاه واحد من طبيبك، ولا يمكن الرد عليها.",
  "For assistance, contact": "للمساعدة، تواصل مع",
  "One-way message: the patient can read these instructions and cannot reply here.":
    "رسالة باتجاه واحد: يمكن للمريض قراءة هذه التعليمات ولا يمكنه الرد هنا.",

  // ─── Remaining patient-portal labels ───
  "The finalized report and study images will appear here once completed.":
    "سيظهر التقرير النهائي وصور الفحص هنا بعد اكتمالهما.",
  "Finalized Report": "التقرير النهائي",
  "Follow-up Instructions": "تعليمات المتابعة",
  "Study Images": "صور الفحص",
  "Requested for": "مطلوب بتاريخ",
  "Submit your identity document to continue.": "أرسل وثيقة هويتك للمتابعة.",
  "Answer each section — add entries or tick \"None\".": "أجب عن كل قسم — أضف مدخلات أو حدد \"لا شيء\".",
  "The questions below are optional and answered voluntarily. This information is access-controlled.":
    "الأسئلة التالية اختيارية وتُجاب طوعاً، وهذه المعلومات محمية بضوابط الوصول.",
  "Inhaler Device": "جهاز الاستنشاق",
  "Diagnoses recorded by your doctors appear here. Clinical note contents are visible to your doctors only.":
    "تظهر هنا التشخيصات التي سجلها أطباؤك. محتوى الملاحظات السريرية مرئي لأطبائك فقط.",
  "No code": "بدون رمز",
  "Coding review in progress": "مراجعة الترميز قيد التنفيذ",
  "e.g. Tripoli Central Hospital": "مثال: مستشفى طرابلس المركزي",
  "Upload vaccination card or supporting document": "ارفع بطاقة التطعيم أو مستنداً داعماً",
  "Result": "النتيجة",

  // Patient Registration screen
  "Patient Registration": "تسجيل المريض",
  "Step {current} of {total} — {step}. Your answers become your locked medical history.":
    "الخطوة {current} من {total} — {step}. إجاباتك تصبح تاريخك الطبي المُقفل.",
  "Medical History": "التاريخ الطبي",
  "Medications & Surgeries": "الأدوية والعمليات الجراحية",
  "Lifestyle & Pregnancy": "نمط الحياة والحمل",
  "First name": "الاسم الأول",
  "Middle name": "الاسم الأوسط",
  "Last name": "اللقب",
  "First Name": "الاسم الأول",
  "Father's Name": "اسم الأب",
  "Grandfather's Name": "اسم الجد",
  "Last Name": "اللقب",
  "Name (English)": "الاسم (بالإنجليزية)",
  "Name (Arabic)": "الاسم (بالعربية)",
  "Exactly as it appears on your Passport or official English identification document, including the same spelling and order.":
    "كما يظهر تماماً في جواز السفر أو وثيقة الهوية الرسمية بالإنجليزية، بنفس التهجئة والترتيب.",
  "Exactly as it appears on your official Arabic document.":
    "كما يظهر تماماً في الوثيقة الرسمية بالعربية.",
  // ─── Document scanner (unified verification scanning) ───
  "Scan Document": "مسح المستند",
  "Upload Document": "رفع مستند",
  "Scan your document or upload an existing document": "امسح مستندك ضوئياً أو ارفع مستنداً موجوداً",
  "Scan both sides of the card — front side first, then the back side, using Add Page.":
    "امسح وجهي البطاقة — الوجه الأمامي أولاً ثم الوجه الخلفي، باستخدام «إضافة صفحة».",
  "Starting camera…": "جارٍ تشغيل الكاميرا…",
  "Camera access is required for scanning. Allow camera access and try again, or use Upload Document instead.":
    "المسح الضوئي يتطلب الوصول إلى الكاميرا. اسمح بالوصول إلى الكاميرا وحاول مجدداً، أو استخدم «رفع مستند» بدلاً من ذلك.",
  "Document scanning is not supported on this device. Please use Upload Document instead.":
    "المسح الضوئي للمستندات غير مدعوم على هذا الجهاز. يرجى استخدام «رفع مستند» بدلاً من ذلك.",
  "Scanning is not supported on this device — please use Upload Document.":
    "المسح غير مدعوم على هذا الجهاز — يرجى استخدام «رفع مستند».",
  "Position the document inside the frame": "ضع المستند داخل الإطار",
  "Hold steady…": "ابقَ ثابتاً…",
  "Hold steady… capturing": "ابقَ ثابتاً… جارٍ الالتقاط",
  "Capturing…": "جارٍ الالتقاط…",
  "The document is captured automatically when it is stable and correctly positioned.":
    "يتم التقاط المستند تلقائياً عندما يكون ثابتاً وفي الوضع الصحيح.",
  "Flash": "الفلاش",
  "Capture": "التقاط",
  "Back to Upload Document": "العودة إلى «رفع مستند»",
  "Scanned page": "الصفحة الممسوحة",
  "No scanned pages yet. Tap Add Page to scan the document.":
    "لا توجد صفحات ممسوحة بعد. اضغط «إضافة صفحة» لمسح المستند.",
  "Retake": "إعادة الالتقاط",
  "Add Page": "إضافة صفحة",
  "Confirm Scan": "تأكيد المسح",
  "Remove page": "إزالة الصفحة",
  "Confirm Scan combines the pages into one PDF and securely attaches it to your verification. Retaken pages are never saved.":
    "يجمع «تأكيد المسح» الصفحات في ملف PDF واحد ويرفقه بأمان إلى عملية التحقق. الصفحات المعاد التقاطها لا تُحفظ أبداً.",
  "Please select a PDF or a photo of the document.": "يرجى اختيار ملف PDF أو صورة للمستند.",
  "Date of birth": "تاريخ الميلاد",
  "Phone number": "رقم الهاتف",
  "Email": "البريد الإلكتروني",
  "Street, city, country": "الشارع، المدينة، الدولة",
  "e.g. Spouse, Parent": "مثال: الزوج/الزوجة، أحد الوالدين",
  "Additional Information": "معلومات إضافية",
  "Identification number": "رقم الهوية",
  "National ID / passport number": "رقم الهوية الوطنية / جواز السفر",
  "Language": "اللغة",
  "Please select your sex.": "يرجى اختيار الجنس.",
  "Something went wrong while creating your profile. Please try again.":
    "حدث خطأ أثناء إنشاء ملفك الشخصي. يرجى المحاولة مرة أخرى.",
  "Complete Registration": "إكمال التسجيل",
  "Creating your profile...": "جارٍ إنشاء ملفك الشخصي...",
  "Registration Complete": "تم إكمال التسجيل",
  "Your unique Clinical Identification Number has been generated.":
    "تم إنشاء رقم التعريف السريري (CIN) الخاص بك.",
  "Your CIN is permanent and can never be changed or duplicated.":
    "رقم الـ CIN الخاص بك دائم ولا يمكن تغييره أو تكراره أبداً.",
  "It contains no personal information (such as your date of birth) and doctors can search for you with it.":
    "لا يحتوي على أي معلومات شخصية (مثل تاريخ ميلادك)، ويمكن للأطباء البحث عنك باستخدامه.",
  "Your medical history has been saved to My Health and is locked. It can only be updated by an authorized doctor or administrator.":
    "تم حفظ تاريخك الطبي في «صحتي» وهو مُقفل. لا يمكن تحديثه إلا من قبل طبيب مُصرَّح له أو مسؤول.",
  "Continue to My Dashboard": "المتابعة إلى لوحة التحكم الخاصة بي",
  "Established chronic or previous medical conditions": "أمراض مزمنة قائمة أو حالات طبية سابقة",
  "I have no known medical conditions": "لا توجد لديّ أي حالات طبية معروفة",
  "Previous diseases and important hospitalizations": "أمراض سابقة وحالات دخول مهمة إلى المستشفى",
  "No past medical history": "لا يوجد تاريخ طبي سابق",
  "Drug, food, or environmental allergies": "حساسية من الأدوية أو الطعام أو البيئة",
  "I have no allergies": "لا توجد لديّ أي حساسية",
  'Answer each section — add entries or tick "None".': 'أجب على كل قسم — أضف إدخالات أو حدّد «لا شيء».',
  "Current Medications": "الأدوية الحالية",
  "Medicines you currently take, with dose and frequency": "الأدوية التي تتناولها حالياً، مع الجرعة وعدد المرات",
  "I am not taking any medications": "لا أتناول أي أدوية",
  "Every previous surgery or operation": "كل عملية جراحية سابقة",
  "I never had surgery": "لم أخضع لأي عملية جراحية من قبل",
  "Lifestyle": "نمط الحياة",
  "Smoking status": "حالة التدخين",
  "Alcohol use": "تعاطي الكحول",
  "Other substance use": "استخدام مواد أخرى",
  "Pregnancy": "الحمل",
  "Pregnancy status": "حالة الحمل",
  "Gestational age": "عمر الحمل",
  "e.g. 18 weeks": "مثال: 18 أسبوعاً",
  "Estimated due date": "موعد الولادة المتوقع",
  "Pregnancy history": "تاريخ الحمل",
  "Condition, e.g. Hypertension": "الحالة المرضية، مثال: ارتفاع ضغط الدم",
  "Details (optional)": "تفاصيل (اختياري)",
  "Medication name": "اسم الدواء",
  "Dose, e.g. 500 mg": "الجرعة، مثال: 500 ملغ",
  "Frequency, e.g. Twice daily": "عدد المرات، مثال: مرتين يومياً",
  "Before / after meals": "قبل / بعد الوجبات",
  "Duration, e.g. 14 days": "المدة، مثال: 14 يوماً",
  "Allergen, e.g. Penicillin": "المادة المسببة للحساسية، مثال: البنسلين",
  "Reaction, e.g. Rash": "الأعراض، مثال: طفح جلدي",
  "Type of surgery, e.g. Appendectomy": "نوع العملية، مثال: استئصال الزائدة الدودية",
  "Hospital stay, e.g. 3 days": "مدة الإقامة في المستشفى، مثال: 3 أيام",
  "Additional notes": "ملاحظات إضافية",
  "Reason / indication": "السبب / الدافع",
  "Recovery / outcome": "التعافي / النتيجة",
  "Stop": "إيقاف",
  "Lipid Panel": "دهون الدم",

  // ─── Visits / Doctor visits ───
  "Back to Visits": "العودة إلى الزيارات",
  "Patient Visit Notes": "ملاحظات زيارة المريض",
  "Every doctor visit appears here. Click a visit to see its notes.": "كل زيارة طبية تظهر هنا. اضغط على الزيارة لعرض ملاحظاتها.",
  "No doctor visits yet": "لا توجد زيارات طبية بعد",
  "No clinical notes for this visit": "لا توجد ملاحظات سريرية لهذه الزيارة",

  // ─── My Health drop-box sections / doctor edits ───
  "edited": "عدّل",
  "You can update this patient's medical history during this active visit. Edits are recorded with your name.":
    "يمكنك تحديث التاريخ المرضي لهذا المريض خلال هذه الزيارة الفعّالة. تُسجَّل التعديلات باسمك.",
  "Locked — this patient is not checked in at your hospital yet. Ask the hospital reception to check the patient in first.":
    "مقفل — لم يتم تسجيل دخول هذا المريض إلى مستشفاك بعد. اطلب من الاستقبال تسجيل دخوله أولاً.",
  "Add Condition": "إضافة حالة مرضية",
  "Edit Condition": "تعديل الحالة",
  "Add Surgery": "إضافة عملية جراحية",
  "Edit Surgery": "تعديل العملية",
  "Add Allergy": "إضافة حساسية",
  "Edit Allergy": "تعديل الحساسية",
  "Edit Pregnancy": "تعديل معلومات الحمل",
  "Condition name": "اسم الحالة المرضية",
  "Allergen": "المادة المسببة للحساسية",
  "Allergy type": "نوع الحساسية",
  "Being monitored": "تحت المراقبة",
  "Surgery type": "نوع العملية الجراحية",
  "Confirmed allergy": "حساسية مؤكدة",
  "Reported side effect": "أثر جانبي مُبلَّغ عنه",
  "Remove this entry?": "حذف هذا السجل؟",
  "No pregnancy information was recorded.": "لم يتم تسجيل معلومات حمل.",
  "Save changes": "حفظ التعديلات",
  "Not pregnant": "غير حامل",
  "Pregnant": "حامل",
  "Not applicable": "لا ينطبق",
  "No diagnosis for this visit": "لا يوجد تشخيص لهذه الزيارة",
  "Clinical Note": "ملاحظة سريرية",
  "History": "التاريخ المرضي",
  "Physical Examination": "الفحص السريري",
  "Diagnosis": "التشخيص",
  "Content": "المحتوى",
  "Prescription": "وصفة طبية",
  "Recommendations": "التوصيات",
  "Signed": "موقّعة",
  "Priority": "الأولوية",

  // ─── Prescriptions / Pharmacy ───
  "Your prescriptions and their journey through affiliated pharmacies — from issue to dispensing.":
    "وصفاتك الطبية ورحلتها عبر الصيدليات الشريكة — من الإصدار إلى الصرف.",
  "No prescriptions yet. Prescriptions issued by your doctors appear here.":
    "لا توجد وصفات طبية بعد. تظهر هنا الوصفات الصادرة من أطبائك.",
  "Prescribed by": "وصفها",
  "used": "مستخدمة",
  "Dispensed": "تم الصرف",
  "Substituted": "تم الاستبدال",
  "approved by": "وافق عليها",
  "Reservation": "الحجز",
  "My CIN QR Code": "رمز QR الخاص برقم CIN",
  "Present this QR code at any affiliated pharmacy so the pharmacist can identify your account and dispense your authorized prescriptions.":
    "اعرض رمز QR هذا في أي صيدلية شريكة ليتعرف الصيدلي على حسابك ويصرف وصفاتك المفوّضة.",
  "Choose a Pharmacy": "اختر الصيدلية",
  "The pharmacy only sees this prescription after you select it and explicitly allow dispensing.":
    "لا ترى الصيدلية هذه الوصفة إلا بعد اختيارها والسماح لها بالصرف صراحةً.",
  "Allow Pharmacy Access?": "السماح للصيدلية بالصرف؟",
  "Allow Pharmacy to Dispense": "السماح للصيدلية بالصرف",
  "You are giving {pharmacy} (A&M Pharmacy Number {number}) permission to dispense this prescription and reserve the medication for you.":
    "أنت تمنح {pharmacy} (برقم صيدلية A&M: {number}) إذناً بصرف هذه الوصفة وحجز الدواء لك.",
  "Failed to authorize the pharmacy.": "تعذّر تفويض الصيدلية.",
  "Partially dispensed — {count} unit(s) still to collect at the pharmacy.":
    "تم الصرف جزئياً — {count} وحدة متبقية للاستلام من الصيدلية.",
  "You can authorize another pharmacy, or contact your doctor.": "يمكنك تفويض صيدلية أخرى، أو التواصل مع طبيبك.",
  "Your doctor is reviewing a substitution request from {pharmacy}. The prescription is unchanged until they approve.":
    "طبيبك يراجع طلب استبدال من {pharmacy}. تظل الوصفة دون تغيير حتى يوافق.",

  // ─── Dose reminders / Adherence ───
  "Dose Reminders": "تذكيرات الجرعات",
  "Add time": "إضافة وقت",
  "Remove time": "إزالة الوقت",
  "Save Reminder Times": "حفظ أوقات التذكير",
  "Add reminder times above to log doses against a schedule.": "أضف أوقات التذكير أعلاه لتسجيل الجرعات وفق الجدول.",
  "As-needed medication — reminders do not apply.": "دواء عند الحاجة — لا تنطبق التذكيرات.",
  "Missed dose guidance": "إرشادات الجرعة الفائتة",
  "Log Today's Dose": "تسجيل جرعة اليوم",
  "I took it": "تناولتها",
  "I missed it": "فاتني الجرعة",
  "Taken": "تم تناولها",
  "Missed": "فاتت",
  "Skipped": "تم تخطيها",
  "Logged": "تم التسجيل",
  "Dismiss": "إغلاق",
  "On": "تشغيل",
  "Off": "إيقاف",

  // ─── Medication feedback ───
  "Report a Problem": "الإبلاغ عن مشكلة",
  "Report About {med}": "تقرير عن {med}",
  "What is it about?": "ما موضوع التقرير؟",
  "Describe what happened, when it started, and anything that helps...": "صف ما حدث، ومتى بدأ، وأي تفاصيل مفيدة...",
  "Details": "التفاصيل",
  "Severity": "الشدة",
  "Send Report": "إرسال التقرير",
  "Report recorded": "تم تسجيل التقرير",
  "It is saved in your medical history.": "تم حفظه في تاريخك الطبي.",
  "Your report is added to your medical history. Severe reports alert your doctor.":
    "يُضاف تقريرك إلى تاريخك الطبي. التقارير الشديدة تنبه طبيبك.",
  "Your prescribing doctor has been notified.": "تم إشعار طبيبك المعالج.",
  "Could not record the report.": "تعذّر تسجيل التقرير.",
  "A side effect": "أثر جانبي",
  "Difficulty following the treatment plan": "صعوبة في الالتزام بخطة العلاج",
  "Problem obtaining the medication": "مشكلة في الحصول على الدواء",
  "My clinician changed the treatment": "غيّر طبيبي العلاج",
  "My clinician stopped the treatment": "أوقف طبيبي العلاج",
  "Could not load the prescriptions and requests for this visit. Please reopen the visit to try again.":
    "تعذّر تحميل الوصفات والطلبات لهذه الزيارة. يرجى إعادة فتح الزيارة للمحاولة مجدداً.",
  "Could not load the notes for this visit. Please reopen the visit to try again.":
    "تعذّر تحميل ملاحظات هذه الزيارة. يرجى إعادة فتح الزيارة للمحاولة مجدداً.",
  "Instructions": "التعليمات",
  "Doctor Visits": "زيارات الطبيب",

  // ─── Registration wizard (complete Arabic coverage) ───
  "Medications & Allergies": "الأدوية والحساسية",
  "Lifestyle & Preventive Care": "نمط الحياة والرعاية الوقائية",
  "Could not upload the document. Please try again.": "تعذر رفع المستند. يرجى المحاولة مرة أخرى.",
  "Answer the required questions marked with *.": "أجب عن الأسئلة الإلزامية المميزة بعلامة *.",

  // Medical Conditions & Diagnoses section
  "Medical Conditions & Diagnoses": "الحالات المرضية والتشخيصات",
  "Existing conditions, chronic diseases, previous diagnoses and long-term conditions requiring monitoring":
    "الحالات القائمة، الأمراض المزمنة، التشخيصات السابقة، والحالات طويلة الأمد التي تتطلب متابعة",
  "No medical conditions or diagnoses": "لا توجد حالات مرضية أو تشخيصات",
  "Existing condition / chronic disease": "حالة قائمة / مرض مزمن",
  "Previous diagnosis": "تشخيص سابق",
  "Long-term condition requiring monitoring": "حالة طويلة الأمد تتطلب متابعة",
  "Other significant history": "تاريخ طبي مهم آخر",
  "Active / ongoing": "نشطة / مستمرة",
  "Resolved": "تم التعافي",
  "Under monitoring": "تحت المتابعة",
  "Approximate date of diagnosis": "تاريخ التشخيص التقريبي",
  "Treating facility": "الجهة العلاجية",
  "Current status": "الحالة الحالية",
  "Relevant notes (optional)": "ملاحظات ذات صلة (اختياري)",

  // Hospital Admissions & Significant History section
  "Hospital Admissions & Significant History": "الدخول للمستشفى والتاريخ الطبي المهم",
  "Previous hospital admissions, emergency department visits, injuries and accidents, blood transfusions, infectious diseases and complications of medical treatment":
    "الدخول السابق للمستشفى، زيارات الطوارئ، الإصابات والحوادث، عمليات نقل الدم، الأمراض المعدية، ومضاعفات العلاج الطبي",
  "No hospital admissions or significant history": "لا يوجد دخول سابق للمستشفى أو تاريخ طبي مهم",
  "Previous hospital admission": "دخول سابق للمستشفى",
  "Previous emergency department visit": "زيارة سابقة للطوارئ",
  "Major injury or accident": "إصابة أو حادث كبير",
  "Previous blood transfusion": "نقل دم سابق",
  "History of infectious disease": "تاريخ مرض معدٍ",
  "Complication of medical treatment": "مضاعفة من العلاج الطبي",
  "Other significant medical history": "تاريخ طبي مهم آخر",
  "What happened, e.g. Appendectomy admission": "ما حدث، مثال: دخول لاستئصال الزائدة الدودية",
  "Approximate date": "تاريخ تقريبي",
  "Treating facility, if known": "الجهة العلاجية، إن كانت معروفة",
  "Ongoing": "مستمرة",
  "Transfusion reaction, if any": "تفاعل نقل الدم، إن وُجد",
  "Reaction": "التفاعل",

  // Surgical history
  "Every previous surgery or procedure": "كل عملية أو إجراء جراحي سابق",

  // Family history
  "Diseases or medical conditions that run in your family — mother, father, siblings, children or other relatives. You are not required to provide every family member's information.":
    "أمراض أو حالات طبية منتشرة في عائلتك — الأم، الأب، الإخوة، الأبناء أو أقارب آخرين. لست مطالباً بتقديم معلومات كل فرد من العائلة.",
  "Age at diagnosis": "عمر التشخيص",
  "Age at diagnosis (if known)": "عمر التشخيص (إن كان معروفاً)",
  "e.g. 60s": "مثال: الستينات",

  // Medications section
  "Current & Previous Medications": "الأدوية الحالية والسابقة",
  "Prescription and non-prescription medicines, vitamins, supplements, herbal products, and long-term injections or therapies":
    "الأدوية بوصفة ودون وصفة، الفيتامينات والمكملات، المنتجات العشبية، والحقن أو العلاجات طويلة الأمد",
  "Prescription medication": "دواء بوصفة طبية",
  "Non-prescription (OTC) medication": "دواء يصرف دون وصفة طبية",
  "Vitamin / supplement": "فيتامين / مكمل غذائي",
  "Herbal product": "منتج عشبي",
  "Long-term injection / other therapy": "حقنة طويلة الأمد / علاج آخر",
  "Reason for taking it": "سبب تناوله",
  "Start date, if known": "تاريخ البدء، إن كان معروفاً",
  "End date, if known": "تاريخ الانتهاء، إن كان معروفاً",
  "Prescribing doctor / facility, if known": "الطبيب / الجهة الموصفة، إن كانت معروفة",
  "Currently taking": "أتناوله حالياً",
  "Taken occasionally": "أتناوله أحياناً",
  "Not specified": "غير محدد",

  // Allergies section
  "Allergies & Adverse Reactions": "الحساسية والتفاعلات الضارة",
  "Medication, food, latex, contrast-agent or other allergies and reactions. Your answers are saved as reported by you and are not treated as clinically verified.":
    "حساسية من الأدوية أو الطعام أو اللاتكس أو مادة التباين أو غيرها، والتفاعلات الضارة. تُحفظ إجاباتك كما أجبت بها ولا تُعتبر موثقة سريرياً.",
  "I have no known allergies": "لا توجد لديّ حساسية معروفة",
  "My allergy status is not yet established — I am unsure": "لم يتم تحديد حالة حساسيتي بعد — لست متأكداً",
  "Allergy (confirmed by me)": "حساسية (مؤكدة مني)",
  "Side effect / intolerance": "أثر جانبي / عدم تحمل",
  "Medication": "دوائية",
  "Latex": "اللاتكس",
  "Contrast agent": "مادة التباين",
  "Substance causing the reaction, e.g. Penicillin": "المادة المسببة للتفاعل، مثال: البنسلين",
  "Approximate date, if known": "تاريخ تقريبي، إن كان معروفاً",
  "Treatment required, if any": "العلاج المطلوب، إن وُجد",

  // Lifestyle
  "The questions below are optional and answered voluntarily.": "الأسئلة أدناه اختيارية وتُجاب عنها طوعاً.",
  "Tobacco type and quantity": "نوع التبغ وكميته",
  "e.g. Cigarettes, 10/day": "مثال: سجائر، 10 يومياً",
  "Vaping history": "تاريخ السجائر الإلكترونية",
  "e.g. Never / occasional": "مثال: أبداً / أحياناً",
  "Occupational exposures": "التعرض المهني",
  "e.g. Dust, chemicals — if any": "مثال: غبار، مواد كيميائية — إن وُجد",
  "Physical activity level": "مستوى النشاط البدني",
  "Sedentary": "قليل الحركة",
  "Light": "خفيف",
  "Moderate": "متوسط",
  "Active": "نشط",
  "Typical diet": "النظام الغذائي المعتاد",
  "Sleep concerns": "مشكلات النوم",
  "Mobility / functional limitations": "محددات الحركة / الوظيفة",
  "Living situation / caregiving needs": "الوضع المعيشي / احتياجات الرعاية",
  "Known consanguinity": "زواج الأقارب المعروف",
  "Yes, known": "نعم، معروف",
  "Prefer not to answer": "أفضل عدم الإجابة",

  // Diet & Nutrition
  "Diet & Nutrition": "التغذية والنظام الغذائي",
  "Diet type — select all that apply": "نوع النظام الغذائي — اختر كل ما ينطبق",
  "Regular / Balanced diet": "نظام غذائي عادي / متوازن",
  "Vegetarian": "نباتي (يمتنع عن اللحوم)",
  "Vegan": "نباتي صرف",
  "Mediterranean diet": "النظام الغذائي المتوسطي",
  "Low-carbohydrate diet": "نظام قليل الكربوهيدرات",
  "High-protein diet": "نظام عالي البروتين",
  "Low-salt diet": "نظام قليل الملح",
  "Diabetic diet": "نظام غذائي لمرضى السكري",
  "Renal diet": "نظام غذائي لمرضى الكلى",
  "Gluten-free diet": "نظام خالٍ من الغلوتين",
  "Lactose-free diet": "نظام خالٍ من اللاكتوز",
  "Please specify the other diet": "يرجى تحديد النظام الغذائي الآخر",
  "e.g. Texture-modified diet": "مثال: نظام غذائي معدّل القوام",
  "Food allergies, intolerances & dietary restrictions": "حساسية الطعام وعدم التحمل والقيود الغذائية",
  "e.g. Peanut allergy, lactose intolerance, no pork": "مثال: حساسية الفول السوداني، عدم تحمل اللاكتوز، عدم تناول لحم الخنزير",
  "Diet type": "نوع النظام الغذائي",
  "Diet details": "تفاصيل النظام الغذائي",
  "Food allergies & intolerances": "حساسية الطعام وعدم التحمل",
  "Optional — helps your care team tailor your care and medication advice.":
    "اختياري — يساعد فريق رعايتك على تخصيص رعايتك ونصائح الأدوية.",

  // Sleep Pattern
  "Sleep Pattern": "نمط النوم",
  "Sleep pattern — select all that apply": "نمط النوم — اختر كل ما ينطبق",
  "Sleeps through the night": "ينام طوال الليل",
  "Frequently wakes up during the night": "يستيقظ كثيراً أثناء الليل",
  "Takes a long time to fall asleep": "يستغرق وقتاً طويلاً حتى ينام",
  "Wakes up too early": "يستيقظ مبكراً جداً",
  "Experiences interrupted or restless sleep": "نوم متقطع أو غير هادئ",
  "Sleeps excessively": "ينام بشكل مفرط",
  "Please specify the other sleep pattern": "يرجى تحديد نمط النوم الآخر",
  "e.g. Works night shifts": "مثال: يعمل في نوبات ليلية",
  "Additional sleep-related concerns": "مشكلات إضافية متعلقة بالنوم",
  "Anything else about your sleep (optional)": "أي شيء آخر عن نومك (اختياري)",
  "Sleep pattern": "نمط النوم",
  "Sleep details": "تفاصيل النوم",
  "Optional — select all that apply.": "اختياري — اختر كل ما ينطبق.",

  // Living Situation
  "Living Situation": "الوضع المعيشي",
  "Primary living situation — select one": "الوضع المعيشي الأساسي — اختر واحداً",
  "Lives alone": "يعيش وحده",
  "Lives with immediate family": "يعيش مع الأسرة المباشرة",
  "Lives with extended family": "يعيش مع الأسرة الممتدة",
  "Lives with a caregiver": "يعيش مع مقدم رعاية",
  "Lives in assisted living / residential care": "يقيم في دار رعاية / إقامة مدعومة",
  "Additional details": "تفاصيل إضافية",
  "Please specify the other living situation": "يرجى تحديد الوضع المعيشي الآخر",
  "e.g. Caregiving needs, accessibility (optional)": "مثال: احتياجات الرعاية، سهولة الوصول (اختياري)",
  "Living situation": "الوضع المعيشي",
  "Living situation details": "تفاصيل الوضع المعيشي",
  "Optional — select your primary living situation.": "اختياري — اختر وضعك المعيشي الأساسي.",

  // Vaccination Status
  "Vaccination Status": "حالة التطعيم",
  "Overall vaccination status — select one": "حالة التطعيم العامة — اختر واحداً",
  "Fully vaccinated according to age": "مطعم بالكامل حسب العمر",
  "Partially vaccinated": "مطعم جزئياً",
  "Not vaccinated": "غير مطعم",
  "Vaccination history unknown": "تاريخ التطعيم غير معروف",
  "Vaccination history": "تاريخ التطعيمات",
  "{count} answered": "تمت الإجابة عن {count}",
  "Record only the vaccines you know about. Anything you leave unanswered is saved as not recorded — never as unvaccinated.":
    "سجّل فقط التطعيمات التي تعرفها. أي شيء تتركه دون إجابة يُحفظ كغير مسجل — ولا يُعد غير مطعم.",
  "Optional — recorded as reported by you. Blank answers are saved as not recorded, never as unvaccinated.":
    "اختياري — يُسجل كما أبلغت عنه. الإجابات الفارغة تُحفظ كغير مسجلة، ولا تُعد غير مطعم.",
  "Not recorded": "غير مسجل",
  "Received": "تم التطعيم",
  "Not received": "لم يتم التطعيم",
  "Hepatitis B": "الالتهاب الكبدي ب",
  "Hepatitis A": "الالتهاب الكبدي أ",
  "BCG": "السل (BCG)",
  "Polio": "شلل الأطفال",
  "DTP / DTaP": "الثلاثي البكتيري (DTP / DTaP)",
  "Hib": "المستدمية النزلية ب (Hib)",
  "Pneumococcal": "المكورات الرئوية",
  "MMR": "الحصبة والنكاف والحصبة الألمانية (MMR)",
  "Varicella": "الجديري المائي",
  "HPV": "فيروس الورم الحليمي (HPV)",
  "Meningococcal": "المكورات السحائية",
  "Influenza": "الإنفلونزا",
  "COVID-19": "كوفيد-19",
  "Vaccine name": "اسم التطعيم",
  "Date (if known)": "التاريخ (إن كان معروفاً)",
  "Doses": "عدد الجرعات",
  "DD/MM/YYYY": "يوم/شهر/سنة",

  // Reproductive & Urological History
  "Reproductive & Urological History": "التاريخ التناسلي والبولي",
  "Optional — answered voluntarily. This information is access-controlled and is not displayed unnecessarily.":
    "اختياري — يُجاب عنه طوعاً. هذه المعلومات محمية بالوصول ولا تُعرض إلا عند الحاجة.",
  "Relevant urological or reproductive history": "تاريخ بولي أو تناسلي ذو صلة",

  // Pregnancy history
  "Significant pregnancy complications": "مضاعفات حمل مهمة",
  "Menstrual history": "تاريخ الحيض",
  "Contraception history": "تاريخ منع الحمل",
  "Fertility-related history": "تاريخ متعلق بالخصوبة",
  "Relevant gynecological history": "تاريخ نسائي ذو صلة",

  // Immunizations & Preventive Care
  "Immunizations & Preventive Care": "التطعيمات والرعاية الوقائية",
  "Vaccinations (childhood and adult, e.g. tetanus, hepatitis B, influenza), previous screening tests with dates and results, and preventive care history":
    "التطعيمات (في الطفولة والكبار، مثل الكزازة والالتهاب الكبدي ب والإنفلونزا)، فحوصات التشخيص الوقائي السابقة بتواريخها ونتائجها، وتاريخ الرعاية الوقائية",
  "No vaccination or screening records to add": "لا توجد سجلات تطعيم أو فحوصات وقائية لإضافتها",
  "Instead of entering every historical dose, you can upload your vaccination card or other supporting documents — they are saved in your Vaccination Records.":
    "بدلاً من إدخال كل جرعة سابقة، يمكنك رفع بطاقة التطعيم أو مستندات داعمة أخرى — تُحفظ ضمن سجلات التطعيم.",
  "Vaccination": "تطعيم",
  "Screening test": "فحص وقائي",
  "Preventive care": "رعاية وقائية",
  "e.g. Tetanus booster, Hepatitis B, Mammography": "مثال: جرعة الكزازة، الالتهاب الكبدي ب، تصوير الثدي",
  "Result / notes (optional)": "النتيجة / ملاحظات (اختياري)",

  // Chronic Care, Devices & Special Needs
  "Chronic Care, Devices & Special Needs": "الرعاية المزمنة والأجهزة والاحتياجات الخاصة",
  "Implanted devices (including pacemakers), prostheses, dialysis, home oxygen, mobility aids, hearing or visual assistance, accessibility requirements, care plans and advance directives":
    "الأجهزة المزروعة (بما في ذلك منظمات ضربات القلب)، الأطراف الاصطناعية، غسيل الكلى، الأكسجين المنزلي، أجهزة مساعدة الحركة، المساعدة السمعية أو البصرية، متطلبات إمكانية الوصول، خطط الرعاية والتوجيهات المسبقة",
  "None of these apply to me": "لا ينطبق عليّ أي مما سبق",
  "Implanted medical device (e.g. pacemaker)": "جهاز طبي مزروع (مثل منظم ضربات القلب)",
  "Prosthesis / surgical implant": "طعم / غرسة جراحية",
  "Dialysis": "غسيل الكلى",
  "Home oxygen / ongoing medical support": "أكسجين منزلي / دعم طبي مستمر",
  "Mobility aid": "جهاز مساعدة على الحركة",
  "Hearing / visual assistance": "مساعدة سمعية / بصرية",
  "Communication / accessibility requirement": "متطلب تواصل / إمكانية وصول",
  "Care plan for a chronic condition": "خطة رعاية لحالة مزمنة",
  "Advance directive / care preferences": "توجيهات مسبقة / تفضيلات الرعاية",
  "e.g. Pacemaker, Hearing aid": "مثال: منظم ضربات القلب، معينة سمعية",

  // Gynaecological & Obstetric History
  "Gynaecological & Obstetric History": "التاريخ النسائي والتوليدي",
  "Answered by you and saved in your Past History. Anything you are unsure about stays marked as unknown — never as a negative history. This information is access-controlled and available to your treating doctors.":
    "تجيبين عنها بنفسك وتُحفظ في تاريخك المرضي. أي معلومة غير متأكدة منها تبقى مسجلة كغير معروفة — ولا تُعدّ أبداً نفياً للمرض. هذه المعلومات محمية بالوصول ومتاحة لأطبائك المعالجين.",
  "Current Pregnancy": "الحمل الحالي",
  "Menstrual History": "تاريخ الحيض",
  "Past Gynaecological History": "التاريخ النسائي السابق",
  "Gynaecological History": "التاريخ النسائي",
  "Contraception History": "تاريخ منع الحمل",
  "What type of contraception are you currently using?": "ما نوع وسيلة منع الحمل التي تستخدمينها حالياً؟",
  "Which type of oral contraception are you using?": "أي نوع من حبوب منع الحمل تستخدمينه؟",
  "Current contraception": "وسيلة منع الحمل الحالية",
  "Oral contraception type": "نوع حبوب منع الحمل",
  "Oral contraception": "حبوب منع الحمل",
  "Injectable contraception": "حقن منع الحمل",
  "Intrauterine device (IUD)": "اللولب الرحمي (IUD)",
  "Contraceptive patch": "لاصقة منع الحمل",
  "Vaginal ring": "الحلقة المهبلية",
  "Condoms / Barrier methods": "الواقي الذكري / الوسائل الحاجزة",
  "Natural / Fertility awareness methods": "الطرق الطبيعية / معرفة أيام الخصوبة",
  "Permanent contraception": "منع الحمل الدائم",
  "Combined oral contraceptive pill (COC – Estrogen + Progestin)": "الحبة المركبة (إستروجين + بروجستين)",
  "Progestin-only pill (POP / Mini-pill)": "حبة البروجستين فقط (الميني بيل)",
  "Emergency contraceptive pill": "حبة منع الحمل الطارئ",
  "Other / Not sure": "أخرى / غير متأكدة",
  "Past Obstetric History": "التاريخ التوليدي السابق",
  "Menopause": "انقطاع الطمث (سن اليأس)",
  "Are you currently pregnant?": "هل أنت حامل حالياً؟",
  "Have you reached menopause?": "هل وصلتِ إلى انقطاع الطمث؟",
  "Postmenopausal": "بعد انقطاع الطمث",
  "Premenopausal": "قبل انقطاع الطمث",
  "Recorded as Not pregnant.": "تم التسجيل: غير حامل.",
  "Recorded as Premenopausal.": "تم التسجيل: قبل انقطاع الطمث.",
  "Recorded as unknown — please confirm with your doctor at your next visit.":
    "تم التسجيل: غير معروف — يُرجى التأكيد مع طبيبك في زيارتك القادمة.",
  "Recorded as Premenopausal — a pregnant patient is never classified as postmenopausal.":
    "تم التسجيل: قبل انقطاع الطمث — لا تُصنَّف المريضة الحامل أبداً على أنها بعد انقطاع الطمث.",
  "Yes": "نعم",
  "No": "لا",
  "Last menstrual period (LMP)": "آخر دورة شهرية (LMP)",
  "Age at menarche": "العمر عند أول دورة",
  "Cycle regularity": "انتظام الدورة",
  "Regular": "منتظمة",
  "Irregular": "غير منتظمة",
  "Cycle length (days)": "طول الدورة (أيام)",
  "Bleeding duration (days)": "مدة النزف (أيام)",
  "Menstrual flow": "كمية النزف",
  "Light": "خفيف",
  "Normal": "طبيعي",
  "Heavy": "غزير",
  "Dysmenorrhoea (period pain)": "عسر الطمث (ألم الدورة)",
  "Mild": "خفيف",
  "Moderate": "متوسط",
  "Severe": "شديد",
  "Abnormal uterine bleeding": "نزف رحمي غير طبيعي",
  "Additional details about your periods": "تفاصيل إضافية عن دورتك",
  "Anything else your doctor should know about your periods": "أي معلومة أخرى عن دورتك يجب أن يعرفها طبيبك",
  "Select any condition you have had, and add details where you can.":
    "اختاري أي حالة أصبتِ بها سابقاً، وأضيفي التفاصيل إن أمكن.",
  "Details — when, treatment, outcome (optional)": "التفاصيل — متى، العلاج، النتيجة (اختياري)",
  "Pelvic inflammatory disease": "التهاب الحوض",
  "Sexually transmitted infection": "عدوى منقولة جنسياً",
  "Endometriosis": "بطانة الرحم المهاجرة",
  "Polycystic ovary syndrome (PCOS)": "متلازمة تكيس المبايض",
  "Uterine fibroids": "الأورام الليفية الرحمية",
  "Ovarian cysts": "أكياس المبيض",
  "Cervical abnormality (e.g. abnormal smear, HPV)": "خلل في عنق الرحم (مثل مسحة غير طبيعية أو فيروس HPV)",
  "Other gynaecological condition": "حالة نسائية أخرى",
  "Previous pelvic infections": "التهابات الحوض السابقة",
  "Previous gynaecological operations": "العمليات النسائية السابقة",
  "Treatments received": "العلاجات التي تلقيتِها",
  "Relevant investigations": "الفحوصات ذات الصلة",
  "Other gynaecological details": "تفاصيل نسائية أخرى",
  "Previous gynaecological conditions": "الأمراض النسائية السابقة",
  "Gravida counts every pregnancy. Para counts births from 24 weeks onwards. Abortions counts pregnancies that ended before 24 weeks. Each pregnancy is counted once.":
    "Gravida هو عدد مرات الحمل. Para هو عدد الولادات من الأسبوع 24 فما بعد. Abortions هو عدد الأحمال التي انتهت قبل الأسبوع 24. يُحسب كل حمل مرة واحدة فقط.",
  "Number of pregnancies (Gravida)": "عدد مرات الحمل (Gravida)",
  "Gravida (G)": "عدد مرات الحمل (G)",
  "Not asked — you are recorded as postmenopausal, so your menstrual cycle questions are skipped. Your menopause details are recorded above.":
    "لم تُطرح عليك أسئلة الدورة الشهرية لأنك مسجّلة كمنقطعة الطمث — وتُسجَّل تفاصيل انقطاع الطمث أعلاه.",
  "Para (P)": "عدد الولادات (P)",
  "Calculated from all your pregnancies, including the current one — you never count it yourself.":
    "يُحسب من جميع أحمالك بما في ذلك حملك الحالي — لا تحتاجين إلى حسابه بنفسك.",
  "Gravida is not shown after menopause — only your previous pregnancy outcomes are recorded below.":
    "لا يُعرض عدد مرات الحمل بعد انقطاع الطمث — تُسجَّل نتائج حمولك السابقة فقط أدناه.",
  "Gravida is not shown because you are not currently pregnant — your previous pregnancy outcomes are recorded below.":
    "لا يُعرض عدد مرات الحمل لأنك لست حاملًا حاليًا — تُسجَّل نتائج حمولك السابقة أدناه.",
  "Para counts births from 24 weeks onwards, including stillbirths, which are also recorded separately so no pregnancy is counted twice. Living children are never used to calculate Gravida.":
    "Para هو عدد الولادات من الأسبوع 24 فما بعد، بما فيها حالات موت الجنين التي تُسجَّل منفصلة أيضًا حتى لا يُحسب أي حمل مرتين. لا يُستخدم عدد الأبناء الأحياء في حساب Gravida.",
  "Your previous pregnancies are recorded next, and Gravida is calculated for you.":
    "تُسجَّل حمولك السابقة تاليًا، ويُحسب Gravida لك تلقائيًا.",
  "Recorded as Not pregnant. Your previous pregnancy outcomes are recorded next.":
    "سُجِّلتِ كغير حامل. تُسجَّل نتائج حمولك السابقة تاليًا.",
  "Gravida (G) counts every pregnancy once, including the current one.":
    "يحسب Gravida (G) كل حمل مرة واحدة، بما في ذلك الحمل الحالي.",
  "Number of births after 24 weeks (Para)": "عدد الولادات بعد الأسبوع 24 (Para)",
  "Number of abortions (before 24 weeks)": "عدد الإجهاضات (قبل الأسبوع 24)",
  "Term deliveries": "ولادات مكتملة (37 أسبوعاً أو أكثر)",
  "Preterm deliveries": "ولادات مبكرة (قبل 37 أسبوعاً)",
  "Miscarriages": "إجهاض تلقائي",
  "Induced abortions": "إجهاض متعمد",
  "Ectopic pregnancies": "حمل خارج الرحم",
  "Stillbirths": "ولادة جنين ميت",
  "Living children": "الأطفال الأحياء",
  "Para and abortions together cannot exceed the number of pregnancies.":
    "لا يمكن أن يتجاوز مجموع الولادات والإجهاضات عدد مرات الحمل.",
  "You entered more pregnancy details than the number of pregnancies.":
    "أدخلتِ تفاصيل أحمال أكثر من عدد مرات الحمل.",
  "Previous pregnancies (details)": "الأحمال السابقة (التفاصيل)",
  "No pregnancy details added yet.": "لم تُضف تفاصيل أي حمل بعد.",
  "Add a previous pregnancy": "إضافة حمل سابق",
  "Edit previous pregnancy": "تعديل حمل سابق",
  "Year": "السنة",
  "Outcome": "النتيجة",
  "Gestational age at delivery or loss": "عمر الحمل عند الولادة أو فقدان الحمل",
  "Mode of delivery": "طريقة الولادة",
  "Neonatal outcome": "حالة المولود",
  "Neonatal details": "تفاصيل عن المولود",
  "Pregnancy complications": "مضاعفات الحمل",
  "Delivery complications": "مضاعفات الولادة",
  "Term delivery (37+ weeks)": "ولادة مكتملة (37 أسبوعاً أو أكثر)",
  "Preterm delivery (before 37 weeks)": "ولادة مبكرة (قبل 37 أسبوعاً)",
  "Miscarriage": "إجهاض تلقائي",
  "Induced abortion": "إجهاض متعمد",
  "Ectopic pregnancy": "حمل خارج الرحم",
  "Stillbirth": "ولادة جنين ميت",
  "Vaginal (spontaneous)": "مهبلية (تلقائية)",
  "Assisted vaginal (forceps / ventouse)": "مهبلية مساعدة (ملقط / شفط)",
  "Caesarean section": "عملية قيصرية",
  "Alive and well": "حي وبصحة جيدة",
  "Admitted to neonatal unit": "أُدخل وحدة حديثي الولادة",
  "Neonatal death": "وفاة المولود",
  "Estimated gestational age": "عمر الحمل التقديري",
  "Pregnancy number": "رقم الحمل",
  "Age at menopause": "العمر عند انقطاع الطمث",
  "Year of menopause": "سنة انقطاع الطمث",
  "Date of last menstrual period": "تاريخ آخر دورة شهرية",
  "Postmenopausal vaginal bleeding": "نزف مهبلي بعد انقطاع الطمث",
  "Hormone replacement therapy (HRT)": "العلاج الهرموني البديل",
  "HRT details": "تفاصيل العلاج الهرموني",
  "Osteoporosis": "هشاشة العظام",
  "Fragility fracture": "كسر هشاشة",
  "Menopausal symptoms": "أعراض انقطاع الطمث",
  "Hot flushes": "هبات الحرارة",
  "Night sweats": "تعرق ليلي",
  "Vaginal dryness": "جفاف المهبل",
  "Sleep disturbance": "اضطراب النوم",
  "Other postmenopausal conditions or treatments": "حالات أو علاجات أخرى بعد انقطاع الطمث",
  "Surgical menopause": "انقطاع طمث جراحي",
  "Reason for surgery": "سبب العملية",
  "Age at surgery": "العمر عند العملية",
  "Pregnancies / births / abortions": "الأحمال / الولادات / الإجهاضات",
  "Menopause status": "حالة انقطاع الطمث",
  "Other Reproductive History": "تاريخ تناسلي آخر",
  "Update current pregnancy": "تحديث الحمل الحالي",
  "e.g. 12 years": "مثال: 12 سنة",
  "e.g. 18 weeks": "مثال: 18 أسبوعاً",
  "e.g. 38 weeks": "مثال: 38 أسبوعاً",
  "e.g. 2019": "مثال: 2019",
  "e.g. 2021": "مثال: 2021",
  "e.g. 42 years": "مثال: 42 سنة",
  "e.g. 49 years": "مثال: 49 سنة",
  "e.g. Type and duration": "مثال: النوع والمدة",
  "e.g. Pelvic infection treated in 2019": "مثال: التهاب حوض عُولج في 2019",
  "e.g. Ovarian cyst removal, 2021": "مثال: استئصال كيس مبيض، 2021",
  "e.g. Hormonal treatment, physiotherapy": "مثال: علاج هرموني، علاج طبيعي",
  "e.g. Ultrasound, cervical smear, biopsy": "مثال: تصوير بالسونار، مسحة عنق الرحم، خزعة",
  "e.g. Diabetes in pregnancy, high blood pressure": "مثال: سكري الحمل، ارتفاع ضغط الدم",
  "e.g. Prolonged labour, bleeding after delivery": "مثال: تعسر الولادة، نزف بعد الولادة",
  "e.g. Birth weight, time in neonatal unit": "مثال: وزن الولادة، مدة البقاء في وحدة حديثي الولادة",
  "e.g. Hysterectomy with removal of both ovaries": "مثال: استئصال الرحم مع المبيضين",
  "Complete": "إكمال",
  "Update": "تحديث",
  "Save progress": "حفظ التقدّم",
  "Save & update my history": "حفظ وتحديث سجلي",
  "Draft": "مسودة",
  "Update history": "سجل التحديثات",
  "No updates yet.": "لا توجد تحديثات بعد.",
  "Recorded": "تاريخ التسجيل",
  "Recorded at registration": "مُسجّل عند التسجيل",
  "Last updated": "آخر تحديث",
  "Updated": "تم التحديث",
  "Saved as a draft — you can return and finish it at any time.":
    "تم الحفظ كمسودة — يمكنك العودة لإكماله في أي وقت.",
  "This section was recorded at registration. You can complete or update it at any time — nothing you saved before is removed.":
    "سُجّل هذا القسم عند التسجيل، ويمكنك إكماله أو تحديثه في أي وقت — لا يُحذف أي شيء سجّلتِه سابقًا.",
  "Could not save your history. Please try again.": "تعذّر حفظ سجلك. يرجى المحاولة مرة أخرى.",
  "Gynaecological, Obstetric & Postmenopausal History": "التاريخ النسائي والتوليدي وتاريخ انقطاع الطمث",
  "Complete or update your gynaecological, obstetric and postmenopausal history. Your earlier answers are kept, every update is recorded, and it is shown to your treating doctors.":
    "أكملي أو حدّثي تاريخك النسائي والتوليدي وتاريخ انقطاع الطمث. تُحفظ إجاباتك السابقة، ويُسجّل كل تحديث، ويظهر ذلك لأطبائك المعالجين.",
  "Your medical history was recorded at registration and is shown to your treating doctors. You can complete or update your Gynaecological & Obstetric History at any time — earlier answers are kept and every update is recorded.":
    "سُجّل تاريخك الطبي عند التسجيل ويظهر لأطبائك المعالجين. يمكنك إكمال أو تحديث تاريخك النسائي والتوليدي في أي وقت — تُحفظ الإجابات السابقة ويُسجّل كل تحديث.",
  // Marital status and the obstetric section
  "Married": "متزوجة",
  "Not Married": "غير متزوجة",
  "Prefer Not to Answer": "أفضل عدم الإجابة",
  "The obstetric history section is hidden. Marital status is saved on its own — it never records anything about pregnancy.":
    "تم إخفاء قسم التاريخ التوليدي. تُحفظ الحالة الاجتماعية بشكل منفصل — ولا تسجّل أي شيء عن الحمل.",
  // Structured allergy form
  "Allergies & Adverse Reactions": "الحساسية وردود الفعل الضارة",
  "Tick the food and medication allergies that apply to you. Your answers are saved as reported by you and are not treated as clinically verified.":
    "حدّد حساسيات الطعام والأدوية التي تنطبق عليك. تُحفظ إجاباتك كما أبلغت عنها ولا تُعتبر مؤكدة طبيًا.",
  "I Have Food Allergies": "لدي حساسية من الطعام",
  "I Have Medication Allergies": "لدي حساسية من الأدوية",
  "Other food allergy": "حساسية أخرى من الطعام",
  "Other medication allergy": "حساسية أخرى من الأدوية",
  "Type the food that is not in the list": "اكتب الطعام غير المذكور في القائمة",
  "Type the medication that is not in the list": "اكتب الدواء غير المذكور في القائمة",
  "Reaction (optional)": "رد الفعل (اختياري)",
  "Remove the allergies you selected in this section?": "هل تريد إزالة الحساسيات التي اخترتها في هذا القسم؟",
  "This will clear the allergies you selected in this form. Continue?":
    "سيؤدي هذا إلى مسح الحساسيات التي اخترتها في هذا النموذج. هل تريد المتابعة؟",
  "Anything you leave empty is saved as not recorded — never as \"no allergies\".":
    "أي شيء تتركه فارغًا يُحفظ كغير مسجّل — ولا يُسجّل أبدًا كـ«لا توجد حساسية».",
  "No Known Allergies": "لا توجد حساسية معروفة",
  "Not Sure": "غير متأكد",
  "Reported by you — not clinically confirmed": "أبلغت عنها بنفسك — غير مؤكدة طبيًا",
  "Peanuts": "الفول السوداني",
  "Tree nuts (almonds, walnuts, cashews)": "المكسرات (اللوز، الجوز، الكاجو)",
  "Milk / dairy": "الحليب ومنتجات الألبان",
  "Eggs": "البيض",
  "Fish": "السمك",
  "Shellfish (shrimp, crab)": "المحار (الجمبري، السلطعون)",
  "Wheat": "القمح",
  "Soy": "الصويا",
  "Sesame": "السمسم",
  "Penicillins (amoxicillin, ampicillin)": "البنسلينات (أموكسيسيلين، أمبيسيلين)",
  "Cephalosporins (ceftriaxone, cephalexin)": "السيفالوسبورينات (سيفترياكسون، سيفاليكسين)",
  "Sulfonamide antibiotics (co-trimoxazole)": "مضادات حيوية سلفوناميد (كوتريموكسازول)",
  "NSAIDs (ibuprofen, aspirin, diclofenac)": "مضادات الالتهاب غير الستيرويدية (إيبوبروفين، أسبرين، ديكلوفيناك)",
  "Macrolide antibiotics (azithromycin, erythromycin)": "مضادات حيوية ماكروليد (أزيثرومايسين، إريثرومايسين)",
  "Fluoroquinolones (ciprofloxacin, levofloxacin)": "فلوروكينولونات (سيبروفلوكساسين، ليفوفلوكساسين)",
  "Anticonvulsants (carbamazepine, lamotrigine)": "مضادات التشنج (كاربامازيبين، لاموتريجين)",
  "Rash": "طفح جلدي",
  "Itching": "حكة",
  "Swelling": "تورم",
  "Difficulty breathing": "صعوبة في التنفس",
  "Anaphylaxis": "تحسس تأقي (أنافيلاكسي)",
  "Nausea / vomiting": "غثيان / قيء",
  "Other reaction": "رد فعل آخر",
  "Don't remember": "لا أتذكر",
  // Vaccination checklist
  "Vaccination checklist": "قائمة التطعيمات",
  "{count} selected": "تم اختيار {count}",
  "Tick the vaccines you have received. A vaccine you leave unticked is saved as not recorded — never as not received.":
    "حدّد التطعيمات التي تلقيتها. أي تطعيم تتركه بدون تحديد يُحفظ كغير مسجّل — ولا يُسجّل أبدًا كغير متلقّى.",
  "Date (optional)": "التاريخ (اختياري)",
  "Doses (optional)": "عدد الجرعات (اختياري)",
  "Notes (optional)": "ملاحظات (اختياري)",
  "Name of the vaccine": "اسم التطعيم",
  "I don't remember my vaccinations": "لا أتذكر تطعيماتي",
  "I have no vaccination records": "ليس لدي سجلات تطعيم",
  "Prefer not to answer": "أفضل عدم الإجابة",
  "BCG (Tuberculosis)": "السل (BCG)",
  "Hepatitis B": "التهاب الكبد ب",
  "Hepatitis A": "التهاب الكبد أ",
  "Polio (OPV/IPV)": "شلل الأطفال (OPV/IPV)",
  "Diphtheria, Tetanus & Pertussis (DTP/DTaP)": "الدفتيريا والتيتانوس والسعال الديكي (DTP/DTaP)",
  "Tetanus (Td/TT)": "التيتانوس (Td/TT)",
  "MMR (Measles, Mumps & Rubella)": "الحصبة والنكاف والحصبة الألمانية (MMR)",
  "Measles": "الحصبة",
  "Varicella (Chickenpox)": "الجدري المائي",
  "Hib (Haemophilus influenzae type b)": "المستدمية النزلية ب (Hib)",
  "Pneumococcal (PCV/PPSV)": "المكورات الرئوية (PCV/PPSV)",
  "Rotavirus": "الفيروس العجلي",
  "Influenza (Flu)": "الإنفلونزا",
  "Other vaccine": "تطعيم آخر",
  "Screening & Preventive Care": "الفحوصات والرعاية الوقائية",
  "Previous screening tests with dates and results, and other preventive care. Your vaccinations are recorded in the checklist below.":
    "الفحوصات السابقة مع تواريخها ونتائجها، وغيرها من الرعاية الوقائية. تُسجَّل تطعيماتك في القائمة أدناه.",
  "e.g. Mammography, Colonoscopy screening": "مثال: تصوير الثدي، فحص القولون",
};

// Dynamic notification messages are generated by backend functions with the
// patient's / doctor's / laboratory's real names, dates and times baked in.
// These rules translate those known English templates into natural Arabic,
// preserving the dynamic values. They run only when the dictionary has no
// exact match for the key.
const AR_MESSAGE_RULES = [
  {
    re: /^New Laboratory Request from Dr\. (.+)$/,
    render: (m) => `طلب تحاليل جديد من الدكتور ${m[1]}`,
  },
  {
    // "You have an appointment with Dr. X on DATE at TIME[ at LOCATION][ — REASON]."
    re: /^You have an appointment with Dr\. (.+?) on (\d{4}-\d{2}-\d{2}) at (.+)$/,
    render: (m) => {
      const rest = m[3].replace(/\.$/, "");
      const tm = rest.match(/^(\S+)(?:\s+at\s+([^—]+?))?(?:\s+—\s+(.*))?$/);
      const time = tm ? tm[1] : rest;
      const loc = tm && tm[2] ? tm[2] : "";
      const reason = tm && tm[3] ? tm[3] : "";
      return (
        `لديك موعد مع الدكتور ${m[1]} بتاريخ ${m[2]} في الساعة ${time}` +
        (loc ? ` في ${loc}` : "") +
        (reason ? ` — ${reason}` : "")
      );
    },
  },
  {
    re: /^Dr\. (.+?) has rescheduled your appointment\.\nNew date: (\S+) at (\S+)\n?([\s\S]*)$/,
    render: (m) => {
      const rest = (m[4] || "")
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          if (line.startsWith("Previous: ")) return `السابق: ${line.slice("Previous: ".length)}`;
          if (line.startsWith("Location: ")) return `الموقع: ${line.slice("Location: ".length)}`;
          return line;
        })
        .join("\n");
      return (
        `قام الدكتور ${m[1]} بإعادة جدولة موعدك.\nالتاريخ الجديد: ${m[2]} في الساعة ${m[3]}` +
        (rest ? `\n${rest}` : "")
      );
    },
  },
  {
    re: /^Dr\. (.+?) has scheduled an appointment for you\.\nDoctor: (.*?)\nDate: (\S+)\nTime: (\S+)$/,
    render: (m) =>
      `قام الدكتور ${m[1]} بتحديد موعد لك.\nالطبيب: ${m[2]}\nالتاريخ: ${m[3]}\nالوقت: ${m[4]}`,
  },
  {
    re: /^Results for laboratory tests requested by Dr\. (.+?) are now available(?: from (.+?))?\. Tap to view your results\.$/,
    render: (m) =>
      `نتائج التحاليل التي طلبها الدكتور ${m[1]} متاحة الآن${m[2] ? ` من ${m[2]}` : ""}. اضغط لعرض نتائجك.`,
  },
  {
    re: /^Dr\. (.+?) requested the following laboratory test\(s\): (.+?)\. Date of request: (.+?)(?:\. Indication: (.+?)(?:\.)?)? Select a laboratory and allow it to view the request\.$/,
    render: (m) =>
      `طلب الدكتور ${m[1]} التحاليل التالية: ${m[2]}. تاريخ الطلب: ${m[3]}.` +
      (m[4] ? ` السبب: ${m[4]}.` : "") +
      ` اختر مختبراً واسمح له بعرض الطلب.`,
  },
];

const PatientLanguageContext = createContext(null);

// Language provider for the Patient Portal ONLY. Loads the language saved on
// the patient's profile, flips the document between LTR (English) and RTL
// (Arabic), and persists every change to localStorage + the profile record.
export function PatientLanguageProvider({ children }) {
  const { user } = useAuth();
  const [lang, setLangState] = useState(() => localStorage.getItem(LANG_STORAGE_KEY) || "en");
  const profileIdRef = useRef(null);

  // Apply direction while the Patient Portal is open.
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    el.setAttribute("lang", lang === "ar" ? "ar" : "en");
  }, [lang]);

  // When the patient leaves the portal (logout / navigation), restore the
  // platform-wide language choice (shared storage key) instead of forcing LTR.
  useEffect(
    () => () => {
      const rtl = localStorage.getItem(LANG_STORAGE_KEY) === "ar";
      document.documentElement.setAttribute("dir", rtl ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", rtl ? "ar" : "en");
    },
    []
  );

  // Stay in sync with the platform-wide switcher — it writes the same
  // storage key and broadcasts this event, so both UIs update instantly.
  useEffect(() => {
    const onLangChange = (e) => {
      if (e.detail === "ar" || e.detail === "en") setLangState(e.detail);
    };
    window.addEventListener("amedix-lang-change", onLangChange);
    return () => window.removeEventListener("amedix-lang-change", onLangChange);
  }, []);

  // Load the language saved on the patient's profile once per visit.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const profiles = await base44.entities.PatientProfile.filter({ user_id: user.id });
        if (cancelled || profiles.length === 0) return;
        profileIdRef.current = profiles[0].id;
        const saved = profiles[0].preferred_language;
        if (saved === "ar" || saved === "en") {
          setLangState(saved);
          localStorage.setItem(LANG_STORAGE_KEY, saved);
        }
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const setLang = (next) => {
    if (next !== "ar" && next !== "en") return;
    setLangState(next);
    localStorage.setItem(LANG_STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent("amedix-lang-change", { detail: next }));
    if (profileIdRef.current) {
      base44.entities.PatientProfile.update(profileIdRef.current, { preferred_language: next }).catch(console.error);
    }
  };

  const t = useCallback(
    (key, params) => {
      if (key == null) return "";
      let text = lang === "ar" && AR[key] ? AR[key] : key;
      if (lang === "ar" && text === key) {
        // No exact dictionary entry — try the dynamic notification templates.
        for (const rule of AR_MESSAGE_RULES) {
          const m = key.match(rule.re);
          if (m) {
            text = rule.render(m);
            break;
          }
        }
      }
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.split(`{${k}}`).join(v);
        });
      }
      return text;
    },
    [lang]
  );

  return (
    <PatientLanguageContext.Provider
      value={{
        lang,
        setLang,
        t,
        isArabic: lang === "ar",
        dir: lang === "ar" ? "rtl" : "ltr",
        // Locale for date/time formatting inside the Patient Portal.
        locale: lang === "ar" ? "ar" : undefined,
      }}
    >
      {children}
    </PatientLanguageContext.Provider>
  );
}

export function usePatientLanguage() {
  const ctx = useContext(PatientLanguageContext);
  if (!ctx) {
    // Used outside the Patient Portal (e.g. the same components rendered in
    // the Doctor Portal) — everything falls back to English.
    return { lang: "en", setLang: () => {}, t: (key) => key ?? "", isArabic: false, dir: "ltr", locale: undefined };
  }
  return ctx;
}