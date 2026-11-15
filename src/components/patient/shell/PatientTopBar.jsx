import React from "react";
import { ChevronDown, Heart, User } from "lucide-react";
import NotificationsBar from "@/components/patient/NotificationsBar";
import { usePatientLanguage } from "@/lib/patientLanguage";

// Top bar of the Patient Portal — the welcome greeting, the portal's language
// switch, the notifications bell and the patient's own profile entry point.
export default function PatientTopBar({ profile, patientId, title, onOpenProfile, onNavigate }) {
  const { t, isArabic, setLang } = usePatientLanguage();
  const firstName = profile?.first_name || profile?.full_name?.split(" ")[0] || "";
  const firstNameAr = profile?.first_name_ar || firstName;

  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="flex flex-wrap items-baseline gap-x-2 text-2xl font-bold tracking-tight text-patient-ink">
          {title || (
            <>
              <span>{t("Welcome,")} {firstName} 👋</span>
              {firstNameAr && isArabic && (
                <span className="text-lg font-semibold text-patient-muted">مرحبا {firstNameAr}</span>
              )}
            </>
          )}
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-patient-muted">
          <Heart className="h-4 w-4 shrink-0 text-patient-red" />
          {t("Your personal health portal with AMedix")}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center rounded-full border border-white/70 bg-card/70 p-1 backdrop-blur-xl">
          {[
            { code: "en", label: "English" },
            { code: "ar", label: "العربية" },
          ].map((option) => {
            const selected = option.code === "ar" ? isArabic : !isArabic;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => setLang(option.code)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selected ? "bg-patient-accent text-white shadow-sm" : "text-patient-muted hover:text-patient-ink"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {patientId && <NotificationsBar patientId={patientId} onNavigate={onNavigate} />}

        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2 rounded-full border border-white/70 bg-card/70 py-1.5 pl-2 pr-3 backdrop-blur-xl transition-colors hover:border-patient-accent/40"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-patient-accent/12 text-patient-accent">
            <User className="h-4 w-4" />
          </span>
          <span className="max-w-[9rem] truncate text-sm font-semibold text-patient-ink">
            {isArabic ? firstNameAr : firstName}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-patient-muted" />
        </button>
      </div>
    </div>
  );
}