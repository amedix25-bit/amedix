import React from "react";
import { Heart } from "lucide-react";
import NotificationsBar from "@/components/patient/NotificationsBar";
import PatientProfileMenu from "@/components/patient/shell/PatientProfileMenu";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function PatientTopBar({ profile, patientId, title, onOpenProfile, onNavigate, notificationOpen, onNotificationOpenChange }) {
  const { t, isArabic, setLang } = usePatientLanguage();
  const firstName = profile?.first_name || profile?.full_name?.split(" ")[0] || "";
  const arabicName = profile?.first_name_ar || profile?.full_name_ar?.split(" ")[0] || "";
  return <header className="pp-topbar">
    <div className="pp-welcome">
      <h1>{title || <><span dir="ltr">Welcome, {firstName} <span aria-hidden="true">👋</span></span><span className="pp-welcome-ar" lang="ar" dir="rtl">مرحبا {arabicName}</span></>}</h1>
      <p><Heart />{t("Your personal health portal with AMedix")}</p>
    </div>
    <div className="pp-header-controls">
      <div className="pp-language" role="group" aria-label={t("Choose Your Language")}>
        <button type="button" lang="en" aria-pressed={!isArabic} onClick={() => setLang("en")}>English</button>
        <button type="button" lang="ar" aria-pressed={isArabic} onClick={() => setLang("ar")}>العربية</button>
      </div>
      {patientId && <NotificationsBar patientId={patientId} onNavigate={onNavigate} compact open={notificationOpen} onOpenChange={onNotificationOpenChange} />}
      <PatientProfileMenu name={isArabic ? arabicName || firstName : firstName} onOpenProfile={onOpenProfile} onNavigate={onNavigate} />
    </div>
  </header>;
}