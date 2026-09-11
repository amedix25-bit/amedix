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