import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// Platform-wide language system. Shares the SAME storage key as the Patient
// Portal language engine (src/lib/patientLanguage.jsx) so there is a single
// source of truth, and the two providers stay in sync through the
// "amedix-lang-change" window event. The language survives login/logout and
// page navigation, and switching never reloads or loses the current page.
const LANG_STORAGE_KEY = "amedix_patient_lang";
const LANG_CHANGE_EVENT = "amedix-lang-change";

// Arabic translations for the platform chrome — Welcome, role selection,
// login / registration, and every portal's sidebar. Keys are the English
// strings used in the components — t() falls back to the English key when no
// entry exists. "CIN" is intentionally NOT translated.
const AR = {
  // ─── Welcome page ───
  "Welcome to AMedix": "مرحباً بك في AMedix",
  "AMedix was created by two medical students, Ayatallah Abed Elallegy and Mohammed Saad Alsaba, with a simple vision: to make healthcare easier for patients and healthcare professionals.":
    "تم إنشاء AMedix على يد طالبَي طب، آية الله عبد الجليل ومحمد سعد الصباع، برؤية بسيطة: جعل الرعاية الصحية أسهل للمرضى والعاملين في المجال الصحي.",
  "Our goal is to bring the patient's healthcare journey into one place, connecting patients, doctors, and laboratories through one simple platform.":
    "هدفنا هو جمع رحلة المريض الصحية في مكان واحد، وربط المرضى والأطباء والمختبرات عبر منصة واحدة بسيطة.",
  "From medical information and doctors' notes to laboratory requests and results, AMedix is designed to make healthcare more organized, accessible, and connected.":
    "من المعلومات الطبية وملاحظات الأطباء إلى طلبات المختبر ونتائجها، صُمم AMedix لجعل الرعاية الصحية أكثر تنظيماً وإتاحةً وترابطاً.",
  "AMedix — Your Healthcare, All in One Place.": "AMedix — رعايتك الصحية، كلها في مكان واحد.",
  "Get Started": "ابدأ الآن",

  // ─── Landing (role choice) ───
  "Connected Care. Better Health.": "رعاية متصلة. صحة أفضل.",
  "AMedix · Connected Care. Better Health.": "AMedix · رعاية متصلة. صحة أفضل.",
  "Secure, patient-owned clinical records": "سجلات سريرية آمنة يملكها المريض",
  "Your medical information, securely connected to your healthcare.":
    "معلوماتك الطبية، متصلة بأمان برعايتك الصحية.",
  "Choose how you use the platform": "اختر كيف ستستخدم المنصة",
  "I am a Patient": "أنا مريض",
  "I am a Doctor": "أنا طبيب",
  "I am a Radiologist": "أنا طبيب أشعة",
  "I am a Lab": "أنا مختبر",
  "I am a Laboratory Technician": "أنا فني مختبر",
  "Access your clinical records with your unique CIN and control which doctors can see them.":
    "وصول إلى سجلاتك السريرية برقم CIN الفريد الخاص بك، وتحكم بأي الأطباء يمكنهم رؤيتها.",
  "Search patients by CIN, manage appointments, clinical notes, and test requests.":
    "ابحث عن المرضى برقم CIN، وأدر المواعيد والملاحظات السريرية وطلبات الفحوصات.",
  "Register your laboratory, manage technicians, and process laboratory requests.":
    "سجّل مختبرك، وأدر الفنيين، وعالج طلبات التحاليل.",
  "Manage patients, appointments, clinical notes, and test requests.":
    "إدارة المرضى والمواعيد والملاحظات السريرية وطلبات الفحوصات.",
  "Manage authorized patients and radiology records in the Radiologist Portal.":
    "إدارة المرضى المصرّح لهم وسجلات الأشعة في بوابة طبيب الأشعة.",
  "Log in to view your records, appointments, and test results — or create an account to receive your unique Clinical Identification Number (CIN) and QR code.":
    "سجّل الدخول لعرض سجلاتك ومواعيدك ونتائج فحوصاتك — أو أنشئ حساباً للحصول على رقم التعريف السريري الفريد (CIN) ورمز QR الخاص بك.",
  "Log in to manage your patients, appointments, and clinical records — or register your professional account to get started.":
    "سجّل الدخول لإدارة مرضاك ومواعيدك وسجلاتك السريرية — أو سجّل حسابك المهني للبدء.",
  "Log in to your Radiologist Portal to manage your authorized patients and radiology records — or register your professional account to get started.":
    "سجّل الدخول إلى بوابة طبيب الأشعة لإدارة مرضاك المصرّح لك بهم وسجلات الأشعة — أو سجّل حسابك المهني للبدء.",
  "Register your laboratory, manage technicians, and process laboratory requests — or sign in to your Lab Portal.":
    "سجّل مختبرك، وأدر الفنيين، وعالج طلبات التحاليل — أو سجّل الدخول إلى بوابة المختبر.",
  "Continue": "متابعة",
  "Unique CIN": "رقم CIN فريد",
  "Every patient receives a permanent, searchable identification number.":
    "يحصل كل مريض على رقم تعريف دائم قابل للبحث.",
  "Patient-Controlled Access": "وصول يتحكم به المريض",
  "Doctors can only view your record after you approve their request.":
    "لا يمكن للأطباء عرض سجلك إلا بعد موافقتك على طلبهم.",
  "All Records in One Place": "كل السجلات في مكان واحد",
  "Appointments, labs, imaging, documents and medications, together.":
    "المواعيد والتحاليل والأشعة والمستندات والأدوية، كلها معاً.",
  "Back": "رجوع",
  "Log In": "تسجيل الدخول",
  "Create Account": "إنشاء حساب",
  "I am neither — choose again": "لست أياً من هؤلاء — اختر مرة أخرى",
  "I am a Doctor — choose your role": "أنا طبيب — اختر دورك",

  // ─── Home (post-login role selection) ───
  "Choose your account type to get started": "اختر نوع حسابك للبدء",
  "Receive a unique Clinical Identification Number (CIN) and manage your health records in one secure place.":
    "احصل على رقم تعريف سريري فريد (CIN) وأدر سجلاتك الصحية في مكان واحد آمن.",
  "Register your professional account, search patients by CIN, and manage clinical records and test requests.":
    "سجّل حسابك المهني، وابحث عن المرضى برقم CIN، وأدر السجلات السريرية وطلبات الفحوصات.",
  "Get started": "ابدأ",
  "Register": "سجّل الآن",
  "Doctor Registration": "تسجيل طبيب",
  "Radiologist Registration": "تسجيل طبيب أشعة",
  "Enter your professional details": "أدخل بياناتك المهنية",
  "First Name *": "الاسم الأول *",
  "First name": "الاسم الأول",
  "Middle Name": "الاسم الأوسط",
  "Middle name": "الاسم الأوسط",
  "Last Name *": "اسم العائلة *",
  "Last name": "اسم العائلة",
  "Specialization *": "التخصص *",
  "e.g. Cardiology": "مثال: أمراض القلب",
  "e.g. Diagnostic Radiology": "مثال: الأشعة التشخيصية",
  "License Number *": "رقم الترخيص *",
  "Medical license number": "رقم الترخيص الطبي",
  "Hospital / Clinic": "المستشفى / العيادة",
  "Hospital or clinic name": "اسم المستشفى أو العيادة",
  "Hospital / Imaging Center": "المستشفى / مركز الأشعة",
  "Hospital or imaging center name": "اسم المستشفى أو مركز الأشعة",
  "Phone": "الهاتف",
  "Contact number": "رقم التواصل",
  "Create Doctor Account": "إنشاء حساب الطبيب",
  "Create Radiologist Account": "إنشاء حساب طبيب الأشعة",

  // ─── Auth layout ───
  "Connected Care.": "رعاية متصلة.",
  "Better Health.": "صحة أفضل.",
  "A secure healthcare platform connecting doctors and patients in one unified, confidential system.":
    "منصة صحية آمنة تربط الأطباء والمرضى في نظام موحد وسري.",
  "Unique Clinical Identification Number (CIN) for every patient": "رقم تعريف سريري فريد (CIN) لكل مريض",
  "You own your medical records — doctors access them only with your consent":
    "أنت تملك سجلاتك الطبية — يصل إليها الأطباء فقط بموافقتك",
  "Manage appointments, lab results, imaging, and documents in one place":
    "أدر المواعيد ونتائج التحاليل والأشعة والمستندات في مكان واحد",
  "© 2026 AMedix. All rights reserved.": "© 2026 AMedix. جميع الحقوق محفوظة.",

  // ─── Login ───
  "Welcome Back": "مرحباً بعودتك",
  "Log in to your A&M Healthcare account": "سجّل الدخول إلى حسابك في AMedix",
  "Don't have an account?": "ليس لديك حساب؟",
  "Create one": "أنشئ حساباً",
  "Continue with Google": "المتابعة عبر Google",
  "or": "أو",
  "Email": "البريد الإلكتروني",
  "Password": "كلمة المرور",
  "Forgot password?": "نسيت كلمة المرور؟",
  "Logging in...": "جارٍ تسجيل الدخول...",
  "Log in": "تسجيل الدخول",
  "Invalid email or password": "البريد الإلكتروني أو كلمة المرور غير صحيحة",

  // ─── Portal login validation ───
  "Patient": "مريض",
  "Patient Login": "تسجيل دخول المريض",
  "Doctor Login": "تسجيل دخول الطبيب",
  "Radiologist Login": "تسجيل دخول طبيب الأشعة",
  "Laboratory Login": "تسجيل دخول المختبر",
  "Administrator Login": "تسجيل دخول مدير النظام",
  "Incorrect login. This account is registered as {role}. Please use the {roleLogin}.":
    "تسجيل دخول غير صحيح. هذا الحساب مسجّل كـ{role}. يرجى استخدام {roleLogin}.",
  "Welcome back, {name} — Continue as:": "مرحباً بعودتك، {name} — تابع كـ:",
  "Continue as Patient": "متابعة كمريض",
  "Continue as Doctor": "متابعة كطبيب",
  "Continue as Radiologist": "متابعة كطبيب أشعة",
  "Continue as Laboratory": "متابعة كمختبر",
  "Continue as Administrator": "متابعة كمدير نظام",
  "Choose a different portal": "اختيار بوابة دخول أخرى",

  // ─── Patient account for professionals & portal switching ───
  "Switch Portal to Patient": "التبديل إلى بوابة المريض",
  "Create Patient Account": "إنشاء حساب مريض",

  // ─── Register ───
  "Verify your email": "تحقق من بريدك الإلكتروني",
  "We sent a code to {email}": "أرسلنا رمزاً إلى {email}",
  "Verify": "تحقق",
  "Verifying...": "جارٍ التحقق...",
  "Didn't receive the code?": "لم تستلم الرمز؟",
  "Resend": "إعادة الإرسال",
  "Join A&M Healthcare": "انضم إلى AMedix",
  "Already have an account?": "لديك حساب بالفعل؟",
  "Create account": "إنشاء حساب",
  "Creating account...": "جارٍ إنشاء الحساب...",
  "Confirm Password": "تأكيد كلمة المرور",
  "Passwords do not match": "كلمتا المرور غير متطابقتين",
  "Registration failed": "فشل التسجيل",
  "Invalid verification code": "رمز التحقق غير صحيح",
  "Failed to resend code": "فشلت إعادة إرسال الرمز",
  "Code sent": "تم إرسال الرمز",
  "Check your email for the new code.": "تحقق من بريدك الإلكتروني للعثور على الرمز الجديد.",

  // ─── Forgot / Reset password ───
  "Reset password": "إعادة تعيين كلمة المرور",
  "We'll send you a link to reset it": "سنرسل لك رابطاً لإعادة تعيينها",
  "Back to log in": "العودة إلى تسجيل الدخول",
  "If an account exists with that email, you'll receive a password reset link shortly.":
    "إذا وُجد حساب بهذا البريد الإلكتروني، ستستلم رابط إعادة تعيين كلمة المرور قريباً.",
  "Email address": "البريد الإلكتروني",
  "Sending...": "جارٍ الإرسال...",
  "Send reset link": "إرسال رابط إعادة التعيين",
  "Invalid reset link": "رابط إعادة التعيين غير صالح",
  "This password reset link is missing or invalid": "رابط إعادة تعيين كلمة المرور مفقود أو غير صالح",
  "Request a new link": "اطلب رابطاً جديداً",
  "The link you used appears to be incomplete. Please request a new password reset email.":
    "يبدو أن الرابط الذي استخدمته غير مكتمل. يرجى طلب بريد إلكتروني جديد لإعادة تعيين كلمة المرور.",
  "New password": "كلمة مرور جديدة",
  "Enter your new password below": "أدخل كلمة المرور الجديدة أدناه",
  "New Password": "كلمة المرور الجديدة",
  "Resetting...": "جارٍ إعادة التعيين...",
  "Failed to reset password": "فشلت إعادة تعيين كلمة المرور",

  // ─── Lab login ───
  "Lab Portal": "بوابة المختبر",
  "Laboratory and technician sign-in": "تسجيل دخول المختبر والفنيين",
  "Don't have a laboratory account?": "ليس لديك حساب مختبر؟",
  "Laboratory": "المختبر",
  "Technician": "فني",
  "Log in to Lab Portal": "تسجيل الدخول إلى بوابة المختبر",
  "Technician Username": "اسم مستخدم الفني",
  "Signing in...": "جارٍ تسجيل الدخول...",
  "Sign in to your workspace": "سجّل الدخول إلى مساحة عملك",
  "Invalid username or password": "اسم المستخدم أو كلمة المرور غير صحيحة",

  // ─── Portal sidebars & headers ───
  "Overview": "نظرة عامة",
  "Find Patient": "البحث عن مريض",
  "My Colleagues": "زملائي",
  "Referral Letters": "خطابات الإحالة",
  "Appointments": "المواعيد",
  "Clinical Notes": "الملاحظات السريرية",
  "Lab Requests": "طلبات التحاليل",
  "Imaging": "الأشعة",
  "Notifications": "الإشعارات",
  "Dashboard": "لوحة التحكم",
  "Pending Tests": "الاختبارات المعلقة",
  "Completed Payments/Results": "المدفوعات/النتائج المكتملة",
  "Patients": "المرضى",
  "Technicians/Staff": "الفنيون/الموظفون",
  "Profile": "الملف الشخصي",
  "Users": "المستخدمون",
  "Doctor Verification": "توثيق الأطباء",
  "Doctor": "طبيب",
  "Radiologist": "طبيب أشعة",
  "Administrator": "مدير النظام",
  "Log out": "تسجيل الخروج",
  "A&M Lab No.": "رقم مختبر A&M",
  "A&M Healthcare Admin Panel": "لوحة تحكم AMedix",
};

const AppLanguageContext = createContext(null);

// Wraps the whole app. Loads the saved language (shared with the Patient
// Portal), flips the document between LTR (English) and RTL (Arabic), and
// persists every change — switching is instant and never reloads the page.
export function AppLanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(LANG_STORAGE_KEY) || "en");

  // Apply direction + language to the document.
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    el.setAttribute("lang", lang === "ar" ? "ar" : "en");
  }, [lang]);

  // Stay in sync with the Patient Portal's own switcher (same storage key).
  useEffect(() => {
    const onLangChange = (e) => {
      if (e.detail === "ar" || e.detail === "en") setLangState(e.detail);
    };
    window.addEventListener(LANG_CHANGE_EVENT, onLangChange);
    return () => window.removeEventListener(LANG_CHANGE_EVENT, onLangChange);
  }, []);

  const setLang = useCallback((next) => {
    if (next !== "ar" && next !== "en") return;
    setLangState(next);
    localStorage.setItem(LANG_STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent(LANG_CHANGE_EVENT, { detail: next }));
  }, []);

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
    <AppLanguageContext.Provider value={{ lang, setLang, t, isArabic: lang === "ar" }}>
      {children}
    </AppLanguageContext.Provider>
  );
}

export function useAppLanguage() {
  const ctx = useContext(AppLanguageContext);
  if (!ctx) {
    return { lang: "en", setLang: () => {}, t: (key) => key ?? "", isArabic: false };
  }
  return ctx;
}