import React from "react";
import { Languages } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Small floating switch button — bottom-right corner of the Patient Portal.
// Toggles the portal between English and Arabic at any time; the choice is
// saved to the patient's profile so it stays active on their next visit.
export default function PatientLanguageSwitch() {
  const { lang, setLang, isArabic } = usePatientLanguage();

  return (
    <button
      onClick={() => setLang(isArabic ? "en" : "ar")}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-lg hover:bg-accent transition-colors"
      title={isArabic ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Languages className="w-4 h-4 text-primary" />
      {isArabic ? "English" : "العربية"}
    </button>
  );
}