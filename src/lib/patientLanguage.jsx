import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const LANG_STORAGE_KEY = "amedix_patient_lang";

// Arabic translations for the Patient Portal. Keys are the English strings used
// in the components — t() falls back to the English key when no entry exists.
// "CIN" is intentionally NOT translated: it is the patient's unique identifier
// and always stays exactly as CIN.
const AR = {
  // Sidebar navigation
  "Home": "الرئيسية",
  "My Health": "صحتي",
  "Appointments": "المواعيد",
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