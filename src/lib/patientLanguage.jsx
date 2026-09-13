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
  "Clinical notes saved by your doctors appear here automatically.":
    "تظهر هنا تلقائياً جميع الملاحظات السريرية التي سجلها أطباؤك.",
  "No clinical notes yet": "لا توجد ملاحظات سريرية بعد",
  "View PDF": "عرض PDF",
  "Provisional Diagnosis": "التشخيص المبدئي",
  "Dr.": "د.",

  // Patient Registration screen
  "Patient Registration": "تسجيل المريض",
  "Step {current} of {total} — {step}. Your answers become your locked medical history.":
    "الخطوة {current} من {total} — {step}. إجاباتك تصبح تاريخك الطبي المُقفل.",
  "Medical History": "التاريخ الطبي",
  "Medications & Surgeries": "الأدوية والعمليات الجراحية",
  "Lifestyle & Pregnancy": "نمط الحياة والحمل",
  "First name": "الاسم الأول",
  "Middle name": "الاسم الأوسط",
  "Last name": "اسم العائلة",
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