import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const LANG_STORAGE_KEY = "amedix_patient_lang";

// Arabic translations for the Patient Portal. Keys are the English strings used
// in the components — t() falls back to the English key when no entry exists.
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

  // Overview
  "Loading...": "جارٍ التحميل...",
  "My CIN": "رقم التعريف السريري الخاص بي",
  "Verified Patient": "مريض مُوثّق",
  "Your permanent Clinical Identification Number — unique to you.": "رقم التعريف السريري الدائم الخاص بك — فريد من نوعه.",
  "Show QR Code": "عرض رمز QR",
  "Lab Requests": "طلبات التحاليل",
  "Personal Information": "المعلومات الشخصية",
  "Medical Information": "المعلومات الطبية",
  "Full Name": "الاسم الكامل",
  "Date of Birth": "تاريخ الميلاد",
  "Age": "العمر",
  "Sex": "الجنس",
  "Emergency Contact Name": "اسم جهة الاتصال للطوارئ",
  "Emergency Contact Phone": "هاتف جهة الاتصال للطوارئ",
  "Known Case Of": "الحالات المرضية المعروفة",
  "Current Medication": "الأدوية الحالية",
  "Allergies": "الحساسية",
  "Smoking Status": "حالة التدخين",
  "Alcohol Use": "تعاطي الكحول",
  "Pregnancy Status": "حالة الحمل",
  "Not specified": "غير محدد",
  "Male": "ذكر",
  "Female": "أنثى",
  "Other": "آخر",
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
    "يمكن للأطباء العثور على سجلك الطبي بمسح هذا الرمز أو البحث برقم التعريف السريري الخاص بك.",

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
  "Select": "اختر",
  "Unknown": "غير معروف",
  "Phone number": "رقم الهاتف",
  "Email": "البريد الإلكتروني",
  "Address": "العنوان",
  "Street, city, country": "الشارع، المدينة، الدولة",
  "Emergency Contact": "جهة الاتصال للطوارئ",
  "Name": "الاسم",
  "Phone": "الهاتف",
  "Relationship": "صلة القرابة",
  "e.g. Spouse, Parent": "مثال: الزوج/الزوجة، أحد الوالدين",
  "Additional Information": "معلومات إضافية",
  "Identification number": "رقم الهوية",
  "National ID / passport number": "رقم الهوية الوطنية / جواز السفر",
  "Blood type": "فصيلة الدم",
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
  "Past Medical History": "التاريخ الطبي السابق",
  "Previous diseases and important hospitalizations": "أمراض سابقة وحالات دخول مهمة إلى المستشفى",
  "No past medical history": "لا يوجد تاريخ طبي سابق",
  "Drug, food, or environmental allergies": "حساسية من الأدوية أو الطعام أو البيئة",
  "I have no allergies": "لا توجد لديّ أي حساسية",
  "Answer each section — add entries or tick \"None\".":
    "أجب على كل قسم — أضف إدخالات أو حدّد «لا شيء».",
  "Current Medications": "الأدوية الحالية",
  "Medicines you currently take, with dose and frequency": "الأدوية التي تتناولها حالياً، مع الجرعة وعدد المرات",
  "I am not taking any medications": "لا أتناول أي أدوية",
  "Past Surgical History": "التاريخ الجراحي السابق",
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
  "Additional notes": "ملاحظات إضافية",
  "Allergen, e.g. Penicillin": "المادة المسببة للحساسية، مثال: البنسلين",
  "Drug": "حساسية دوائية",
  "Food": "حساسية غذائية",
  "Environmental": "حساسية بيئية",
  "Reaction, e.g. Rash": "الأعراض، مثال: طفح جلدي",
  "Mild": "خفيفة",
  "Moderate": "متوسطة",
  "Severe": "شديدة",
  "Type of surgery, e.g. Appendectomy": "نوع العملية، مثال: استئصال الزائدة الدودية",
  "Reason / indication": "السبب / الدافع",
  "Complications": "المضاعفات",
  "Recovery / outcome": "التعافي / النتيجة",
  "Hospital stay, e.g. 3 days": "مدة الإقامة في المستشفى، مثال: 3 أيام",
  "Oral": "عن طريق الفم",
  "Intravenous": "وريدي",
  "Intramuscular": "عضلي",
  "Subcutaneous": "تح الجلد",
  "Topical": "موضعي",
  "Inhalation": "استنشاق",
  "Rectal": "شرجي",
  "Before meals": "قبل الوجبات",
  "After meals": "بعد الوجبات",
  "With meals": "مع الوجبات",
  "Anytime": "في أي وقت",

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
};

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

  // Restore LTR when the patient leaves the portal (logout / navigation).
  useEffect(
    () => () => {
      document.documentElement.setAttribute("dir", "ltr");
      document.documentElement.setAttribute("lang", "en");
    },
    []
  );

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
    if (profileIdRef.current) {
      base44.entities.PatientProfile.update(profileIdRef.current, { preferred_language: next }).catch(console.error);
    }
  };

  const t = useCallback(
    (key, params) => {
      if (key == null) return "";
      let text = lang === "ar" && AR[key] ? AR[key] : key;
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
      value={{ lang, setLang, t, isArabic: lang === "ar", dir: lang === "ar" ? "rtl" : "ltr" }}
    >
      {children}
    </PatientLanguageContext.Provider>
  );
}

export function usePatientLanguage() {
  const ctx = useContext(PatientLanguageContext);
  if (!ctx) {
    return { lang: "en", setLang: () => {}, t: (key) => key ?? "", isArabic: false, dir: "ltr" };
  }
  return ctx;
}