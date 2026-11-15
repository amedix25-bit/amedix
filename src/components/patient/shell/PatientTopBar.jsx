import React from "react";
import { Heart, LogOut } from "lucide-react";
import NotificationsBar from "@/components/patient/NotificationsBar";
import PatientProfileMenu from "@/components/patient/shell/PatientProfileMenu";
import PatientReferenceArt from "@/components/patient/overview/PatientReferenceArt";
import { base44 } from "@/api/base44Client";
import { clearDoctorHospitalSession } from "@/lib/doctorHospitalSession";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function PatientTopBar({ profile, patientId, title, onOpenProfile, onNavigate, notificationOpen, onNotificationOpenChange }) {
  const { t, isArabic, setLang } = usePatientLanguage();
  const logout = () => { clearDoctorHospitalSession(); base44.auth.logout(window.location.origin); };
  const firstName = profile?.first_name || profile?.full_name?.split(" ")[0] || "";
  const arabicName = profile?.first_name_ar || profile?.full_name_ar?.split(" ")[0] || "";
  return <header className="pp-topbar">
    <PatientReferenceArt kind="headerWave" className="pp-header-wave" />
    <div className="pp-welcome">
      <h1>{title || (isArabic ? <span lang="ar" dir="rtl">مرحبا {arabicName || firstName} <span aria-hidden="true">👋</span></span> : <span dir="ltr">Welcome, {firstName} <span aria-hidden="true">👋</span></span>)}</h1>
      <p><Heart />{t("Your personal health portal with AMedix")}</p>
    </div>
    <div className="pp-header-controls">
      <div className="pp-language" role="group" aria-label={t("Choose Your Language")}>
        <button type="button" lang="en" aria-pressed={!isArabic} onClick={() => setLang("en")}>English</button>
        <button type="button" lang="ar" aria-pressed={isArabic} onClick={() => setLang("ar")}>العربية</button>
      </div>
      {patientId && <NotificationsBar patientId={patientId} onNavigate={onNavigate} compact open={notificationOpen} onOpenChange={onNotificationOpenChange} />}
      <PatientProfileMenu name={isArabic ? arabicName || firstName : firstName} onOpenProfile={onOpenProfile} onNavigate={onNavigate} />
      <button type="button" className="pp-logout" onClick={logout} title={t("Log out")} aria-label={t("Log out")}>
        <LogOut /><span>{t("Log out")}</span>
      </button>
    </div>
  </header>;
}