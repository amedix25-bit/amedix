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

  // ─── Sign-up verification gate (phone / email OTP) ───
  "Create your account": "أنشئ حسابك",
  "Verify your phone number or email address to continue.": "أكّد رقم هاتفك أو بريدك الإلكتروني للمتابعة.",
  "Choose how you would like to verify yourself before creating your account.":
    "اختر طريقة التأكيد قبل إنشاء حسابك.",
  "Continue with Phone Number": "المتابعة برقم الهاتف",
  "Your phone number is already verified. This email is only the address you sign in with.":
    "تم تأكيد رقم هاتفك بالفعل. هذا البريد هو عنوان الدخول إلى حسابك فقط.",
  "We will text a 6-digit code to your Libyan mobile number.": "سنرسل رمزاً من ٦ أرقام برسالة نصية إلى رقمك الليبي.",
  "Continue with Email Address": "المتابعة بالبريد الإلكتروني",
  "We will email you a 6-digit code.": "سنرسل رمزاً من ٦ أرقام إلى بريدك الإلكتروني.",
  "Phone Number": "رقم الهاتف",
  "Mobile number": "رقم الهاتف المحمول",
  "Email Address": "البريد الإلكتروني",
  "Libyan numbers only: 091, 092, 093 or 094.": "أرقام ليبية فقط: 091 أو 092 أو 093 أو 094.",
  "Send code": "إرسال الرمز",
  "Sending code...": "جارٍ إرسال الرمز...",
  "We sent a code by SMS to {destination}": "أرسلنا رمزاً برسالة نصية إلى {destination}",
  "Code expires in {time}": "ينتهي الرمز بعد {time}",
  "Resend code in {seconds}s": "إعادة إرسال الرمز بعد {seconds} ثانية",
  "Resend code": "إعادة إرسال الرمز",
  "Use a different number or email": "استخدام رقم أو بريد آخر",
  "We could not send the code. Please try again.": "تعذّر إرسال الرمز. حاول مرة أخرى.",
  "We could not verify that code. Please try again.": "تعذّر التحقق من الرمز. حاول مرة أخرى.",
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

  // ─── Verification Process (profile creation) ───
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
  "Full Name": "الاسم الكامل",
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

  // ─── Hospital Portal ───
  "Hospital Portal": "بوابة المستشفى",
  "Hospital": "مستشفى",
  "Hospital Login": "تسجيل دخول المستشفى",
  "Receptionist": "موظف الاستقبال",
  "Receptionist Login": "تسجيل دخول موظف الاستقبال",
  "Receptionist Username": "اسم مستخدم موظف الاستقبال",
  "Log in to Hospital Portal": "تسجيل الدخول إلى بوابة المستشفى",
  "Don't have a hospital account?": "ليس لديك حساب مستشفى؟",
  "Create Hospital Account": "إنشاء حساب مستشفى",
  "Hospital and receptionist sign-in": "تسجيل دخول المستشفى وموظفي الاستقبال",
  "I am a Hospital": "أنا مستشفى",
  "Register your hospital, manage receptionists, patient check-ins, and visit payments — or sign in to your Hospital Portal.": "سجّل مستشفاك، وأدر موظفي الاستقبال وتسجيل حضور المرضى ومدفوعات الزيارات — أو سجّل الدخول إلى بوابة المستشفى.",
  "Register your hospital, manage receptionists, patient check-ins, and visit payments.": "سجّل مستشفاك، وأدر موظفي الاستقبال وتسجيل حضور المرضى ومدفوعات الزيارات.",
  "Visits": "الزيارات",
  "Receptionists": "موظفو الاستقبال",
  // ── Hospital Portal: Manage Patients + Receptionists ──
  "Manage Patients": "إدارة المرضى",
  "Create Receptionist": "إنشاء موظف استقبال",
  "Total Receptionists": "إجمالي موظفي الاستقبال",
  "Online": "متصل",
  "Offline": "غير متصل",
  "All Time": "كل الفترات",
  "Today": "اليوم",
  "This Week": "هذا الأسبوع",
  "This Month": "هذا الشهر",
  "Custom Range": "فترة مخصصة",
  "From": "من",
  "To": "إلى",
  "Patient Name": "اسم المريض",
  "Date/Time Seen": "تاريخ ووقت الزيارة",
  "Amount Paid": "المبلغ المدفوع",
  "Payment Method": "طريقة الدفع",
  "Total Payments": "إجمالي المدفوعات",
  "Total Patients Seen": "إجمالي المرضى المستقبَلين",
  // ── Hospital Portal: Manage Doctors ──
  "Manage Doctors": "إدارة الأطباء",
  "Add New Doctor": "إضافة طبيب جديد",
  "AMedix Hospital Code": "رمز مستشفى AMedix",
  "Select Specialty": "اختيار التخصص",
  "All Specialties": "كل التخصصات",
  "Copy Code": "نسخ الرمز",
  "Generate Code": "إنشاء الرمز",
  "Remove Doctor": "إزالة الطبيب",
  "Deactivate Doctor": "تعطيل الطبيب",
  "Reactivate Doctor": "إعادة تنشيط الطبيب",
  "Confirm Remove": "تأكيد الإزالة",
  // ── Doctor Portal: My Hospitals ──
  "My Hospitals": "مستشفياتي",
  "Join Hospital": "الانضمام إلى مستشفى",
  "Verify Code": "التحقق من الرمز",
  "Confirm Join": "تأكيد الانضمام",
  "Work Here": "العمل هنا",
  "Working Here": "تعمل هنا حالياً",
  "Your specialty / department at this hospital": "تخصصك / قسمك في هذا المستشفى",
  // ── Hospital OS: Command Center ──
  "Hospital OS": "نظام المستشفى",
  "Command Center": "مركز القيادة",
  "Overview": "نظرة عامة",
  "Clinical Operations": "العمليات السريرية",
  "Administration": "الإدارة",
  "Hospital Command Center": "مركز قيادة المستشفى",
  "Welcome": "مرحباً",
  "Live": "مباشر",
  "Refresh": "تحديث",
  "updated": "آخر تحديث",
  "Loading hospital figures...": "جارٍ تحميل أرقام المستشفى...",
  "Hospital figures could not be loaded.": "تعذر تحميل أرقام المستشفى.",
  "Try again": "إعادة المحاولة",
  "Check-Ins Today": "تسجيلات الدخول اليوم",
  "Active Checked-In Patients": "المرضى المسجلون حالياً",
  "Total Visits Recorded": "إجمالي الزيارات المسجلة",
  "Active Doctors": "الأطباء النشطون",
  "Appointments Today": "مواعيد اليوم",
  "Open Lab Requests": "طلبات مختبر مفتوحة",
  "Imaging Not Completed": "أشعة غير مكتملة",
  "Revenue Today (LYD)": "إيرادات اليوم (د.ل)",
  "Urgent Alerts": "تنبيهات عاجلة",
  "Attention": "يتطلب انتباه",
  "Follow-up": "متابعة",
  "Urgent": "عاجل",
  "No operational backlog detected.": "لا يوجد تراكم تشغيلي.",
  "Laboratory requests overdue": "طلبات مختبر متأخرة",
  "{n} laboratory request(s) authorized more than 48 hours ago are still awaiting processing or validation.":
    "{n} طلب مختبر مصرّح به منذ أكثر من ٤٨ ساعة لا يزال بانتظار المعالجة أو التحقق.",
  "Imaging awaiting reporting": "أشعة بانتظار التقرير",
  "{n} study/studies have images ready but no signed report.": "{n} دراسة لديها صور جاهزة دون تقرير موقّع.",
  "Laboratory requests open": "طلبات مختبر مفتوحة",
  "{n} request(s) are awaiting specimen collection, processing or validation.": "{n} طلب بانتظار جمع العينة أو المعالجة أو التحقق.",
  "Imaging requests open": "طلبات أشعة مفتوحة",
  "{n} imaging request(s) are not completed yet.": "{n} طلب أشعة لم يكتمل بعد.",
  "Doctor associations pending": "طلبات انضمام أطباء معلقة",
  "{n} doctor request(s) are waiting for hospital approval.": "{n} طلب طبيب بانتظار موافقة المستشفى.",
  "Prescriptions awaiting dispensing": "وصفات بانتظار الصرف",
  "{n} prescription(s) have been sent to a pharmacy but not dispensed.": "{n} وصفة أُرسلت إلى صيدلية ولم تُصرف بعد.",
  "Recent Hospital Activity": "أحدث نشاط في المستشفى",
  "No activity recorded yet.": "لا يوجد نشاط مسجل بعد.",
  "Patient checked in": "تم تسجيل دخول مريض",
  "Visit completed": "اكتملت الزيارة",
  "Laboratory results available": "نتائج مختبر متاحة",
  "Radiology report released": "صدر تقرير أشعة",
  "Radiology report signed": "تم توقيع تقرير أشعة",
  "Prescription issued": "صدرت وصفة",
  "Prescription dispensed": "تم صرف وصفة",
  "Department Overview": "نظرة على الأقسام",
  "No doctors are assigned to a department yet.": "لا يوجد أطباء مسندون إلى قسم بعد.",
  "today": "اليوم",
  "Quick Actions": "إجراءات سريعة",
  "Register / Check In Patient": "تسجيل / إدخال مريض",
  "Manage Doctors": "إدارة الأطباء",
  "Lab Panels": "لوحات المختبر",
  "Radiology Department": "قسم الأشعة",
  "Doctor Messages": "رسائل الأطباء",
  "Receptionists": "موظفو الاستقبال",
  "Partnership": "الشراكة",
  "Hospital Profile": "ملف المستشفى",
  "Patient Flow — Last 7 Days": "حركة المرضى — آخر ٧ أيام",
  "recorded visits": "زيارة مسجلة",
  "Every figure above is counted from this hospital's own records. A dash means the figure could not be measured — it is never shown as zero.":
    "كل رقم أعلاه محسوب من سجلات هذا المستشفى. الشرطة تعني أن الرقم لم يُقس، ولا يُعرض أبداً كصفر.",

  // ─── Public entry: patient / professional ───
  "I'm a Patient": "أنا مريض",
  "I'm a Healthcare Professional": "أنا من الكوادر الصحية",
  "Log in to your health record, or create an account to receive your Clinical Identification Number (CIN).":
    "سجّل الدخول إلى سجلك الصحي، أو أنشئ حساباً للحصول على رقم التعريف السريري (CIN).",
  "Doctor, hospital, laboratory, or pharmacy — sign in to your professional portal.":
    "طبيب، مستشفى، مختبر، أو صيدلية — سجّل الدخول إلى بوابتك المهنية.",
  "Patient Login / Register": "دخول / تسجيل المريض",
  "Professional Access": "دخول الكوادر الصحية",
  "Healthcare Professional Access": "دخول الكوادر الصحية",
  "Select your professional portal to log in or register your account.":
    "اختر بوابتك المهنية لتسجيل الدخول أو إنشاء حسابك.",
  "Login or Register": "تسجيل الدخول أو إنشاء حساب",
  "Pharmacy": "صيدلية",
  "Clinical portal for verified doctors.": "بوابة سريرية للأطباء الموثّقين.",
  "Institutional portal for hospitals and clinics.": "بوابة مؤسسية للمستشفيات والعيادات.",
  "Laboratory portal for test requests and results.": "بوابة المختبر لطلبات التحاليل ونتائجها.",
  "Pharmacy portal for prescriptions and medication stock.": "بوابة الصيدلية للوصفات ومخزون الأدوية.",
  "Back to Home": "العودة إلى الرئيسية",
  "Professional accounts are verified by AMedix administration before clinical or institutional access is granted. Hospitals receive an authorization code on approval.":
    "يتم توثيق الحسابات المهنية من إدارة AMedix قبل منح الوصول السريري أو المؤسسي، وتحصل المستشفيات على رمز تفويض عند الموافقة.",

  // ─── Mandatory authorization codes ───
  "Administration Code": "رمز الإدارة",
  "Email Verification": "التحقق من البريد",
  "Hospital Information": "بيانات المستشفى",
  "Laboratory Information": "بيانات المختبر",
  "Pharmacy Information": "بيانات الصيدلية",
  "Professional Information": "المعلومات المهنية",
  "Hospital Approval": "موافقة المستشفى",
  "AMedix Approval": "موافقة AMedix",
  "AMedix Hospital Code": "رمز مستشفى AMedix",
  "AMedix Hospital Code *": "رمز مستشفى AMedix *",
  "AMedix Administration Code *": "رمز إدارة AMedix *",
  "Verify Hospital Code": "التحقق من رمز المستشفى",
  "Verifying hospital code...": "جارٍ التحقق من رمز المستشفى...",
  "Verify Code and Continue": "تحقق من الرمز وتابع",
  "Verifying code...": "جارٍ التحقق من الرمز...",
  "This code could not be verified.": "تعذّر التحقق من هذا الرمز.",
  "This hospital code could not be verified.": "تعذّر التحقق من رمز المستشفى.",
  "Continue to Email Verification": "المتابعة إلى التحقق من البريد",
  "Verified AMedix hospital": "مستشفى AMedix موثّق",
  "Use a different hospital code": "استخدام رمز مستشفى آخر",
  "Verified hospital": "المستشفى الموثّق",
  "Join AMedix as a Doctor": "انضم إلى AMedix كطبيب",
  "Register Your Hospital with AMedix": "سجّل مستشفاك في AMedix",
  "Register Your Laboratory with AMedix": "سجّل مختبرك في AMedix",
  "Register Your Pharmacy with AMedix": "سجّل صيدليتك في AMedix",
  "Registration progress": "تقدم التسجيل",
  "Pending AMedix approval": "بانتظار موافقة AMedix",
  "Your laboratory registration has been submitted": "تم تقديم تسجيل مختبرك",
  "Your pharmacy registration has been submitted": "تم تقديم تسجيل صيدليتك",
  "Go to laboratory portal": "الانتقال إلى بوابة المختبر",
  "Go to pharmacy portal": "الانتقال إلى بوابة الصيدلية",
  "Registration Number *": "رقم التسجيل *",
  "Licence Number *": "رقم الترخيص *",
  "Responsible Person Licence": "ترخيص الشخص المسؤول",
  "Authorised Administrator *": "المسؤول الإداري المعتمد *",
  "Administrator Phone": "هاتف المسؤول الإداري",
  "Licence Document *": "وثيقة الترخيص *",
  "Upload Document": "رفع الوثيقة",
  "Change Document": "تغيير الوثيقة",
  "Access Codes": "رموز الوصول",
  "Institution Approvals": "موافقات المؤسسات",
  "Issue an AMedix Administration Code": "إصدار رمز إدارة AMedix",
  "Institution type *": "نوع المؤسسة *",
  "Institution (optional)": "المؤسسة (اختياري)",
  "Valid for (days)": "صالح لمدة (أيام)",
  "Usage limit": "حد الاستخدام",
  "Internal note": "ملاحظة داخلية",
  "Generate code": "إنشاء الرمز",
  "Code issued — share it now": "تم إصدار الرمز — شاركه الآن",
  "Copy": "نسخ",
  "Code copied": "تم نسخ الرمز",
  "Code revoked": "تم إلغاء الرمز",
  "Code disabled": "تم تعطيل الرمز",
  "Could not update the code": "تعذّر تحديث الرمز",
  "Issued codes": "الرموز الصادرة",
  "No codes issued yet.": "لم تُصدر أي رموز بعد.",
  "Revoke": "إلغاء",
  "Expires": "ينتهي",
  "Used": "مستخدم",
  "Issued by": "أصدره",
  "Institution approved": "تمت الموافقة على المؤسسة",
  "Decision recorded": "تم تسجيل القرار",
  "No institutional registrations have been submitted yet.": "لم يُقدَّم أي تسجيل مؤسسي بعد.",
  "Registration no.": "رقم التسجيل",
  "Licence no.": "رقم الترخيص",
  "Laboratory director": "مدير المختبر",
  "Responsible pharmacist": "الصيدلي المسؤول",
  "Administrator": "المسؤول الإداري",
  "Address": "العنوان",
  "Account email": "بريد الحساب",
  "Submitted": "تاريخ التقديم",
  "Code used": "الرمز المستخدم",
  "Reviewed by": "راجعه",
  "Reason (required to reject)": "السبب (مطلوب عند الرفض)",
  "Approve & activate": "الموافقة والتفعيل",
  "Reject": "رفض",
  "Suspend": "تعليق",
  "Pending your approval": "بانتظار موافقتك",
  "Rejected": "مرفوض",
  "Approve Affiliation": "الموافقة على الانتساب",
  "Affiliation approved": "تمت الموافقة على الانتساب",
  "Affiliation rejected": "تم رفض الانتساب",
  "Awaiting hospital approval": "بانتظار موافقة المستشفى",
  "Not approved": "غير معتمد",
  "Your affiliation request was sent to the hospital administrator. Clinical access at this hospital starts once it is approved.":
    "أُرسل طلب الانتساب إلى مسؤول المستشفى، ويبدأ الوصول السريري في هذا المستشفى بعد الموافقة.",
  "The hospital did not approve this affiliation. Contact the hospital administrator.":
    "لم يوافق المستشفى على هذا الانتساب. تواصل مع مسؤول المستشفى.",
  "Enter the AMedix Hospital Code given to you by your approved hospital.":
    "أدخل رمز مستشفى AMedix الذي حصلت عليه من مستشفاك المعتمد.",
  "Your registration is sent to this hospital for approval. The code is verified again when you submit.":
    "يُرسل تسجيلك إلى هذا المستشفى للموافقة، ويُتحقق من الرمز مرة أخرى عند التقديم.",

  // ─── Messaging (shared conversation components) ───
  "Pending": "قيد الانتظار",
  "In Progress": "قيد المعالجة",
  "Resolved": "تم الحل",
  "Announcement": "إعلان",
  "Correction": "تصحيح",
  "Read": "تمت القراءة",
  "Delivered": "تم التسليم",
  "One-way": "اتجاه واحد",
  "No messages yet": "لا توجد رسائل بعد",
  "Message": "رسالة",
  "Not available": "غير متاح",
  "Access denied": "تم رفض الوصول",
  "General Administration": "الإدارة العامة",
  "Human Resources": "الموارد البشرية",
  "Scheduling & Duty Rosters": "الجداول والمناوبات",
  "Finance & Payments": "المالية والمدفوعات",
  "Medical Administration": "الإدارة الطبية",
  "IT Support": "الدعم التقني",
  "Equipment & Supplies": "المعدات والمستلزمات",
  "Complaints & Suggestions": "الشكاوى والاقتراحات",
  "General Inquiries": "استفسارات عامة",
  "Follow-up instructions": "تعليمات المتابعة",
  "Appointment reminder": "تذكير بموعد",
  "Medication instructions": "تعليمات الأدوية",
  "Test / imaging preparation": "التحضير للتحليل / التصوير",
  "Post-consultation care": "الرعاية بعد الاستشارة",
  "Approved educational material": "مواد تعليمية معتمدة",
  "General message": "رسالة عامة",
  "Hospital announcement": "إعلان المستشفى",
  "all doctors": "جميع الأطباء",
  "One-way message: the patient can read these instructions and cannot reply here.":
    "رسالة باتجاه واحد: يمكن للمريض قراءة هذه التعليمات ولا يمكنه الرد هنا.",
  "This is a one-way message from your doctor. Replies are not available.":
    "هذه رسالة باتجاه واحد من طبيبك، ولا يمكن الرد عليها.",
  "For assistance, contact": "للمساعدة، تواصل مع",
  "Activity & access trail": "سجل النشاط والوصول",
  "No messages from your doctors yet": "لا توجد رسائل من أطبائك بعد",
  "Select a message": "اختر رسالة",
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