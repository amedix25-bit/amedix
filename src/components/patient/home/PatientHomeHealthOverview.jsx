import React from "react";
import { CalendarDays, ChevronRight, Heart } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function PatientHomeHealthOverview({ appointment, onNavigate }) {
  const { t, locale } = usePatientLanguage();

  const date = appointment?.date ? new Date(`${appointment.date}T00:00:00`) : null;
  const validDate = date && !Number.isNaN(date.getTime());
  const [hour, minute] = String(appointment?.time || "").split(":");
  const time = appointment?.time && Number.isFinite(Number(hour))
    ? new Date(2000, 0, 1, Number(hour), Number(minute || 0)).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })
    : "";

  const summary = validDate
    ? [date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }), time].filter(Boolean).join(" • ")
    : t("Not available");

  return (
    <section>
      <h2 className="mb-2.5 flex items-center gap-2 font-heading text-base font-bold text-patient-ink sm:text-lg">
        <Heart className="h-4 w-4 text-info" aria-hidden="true" />
        {t("Your Health Overview")}
      </h2>

      <button
        type="button"
        onClick={() => onNavigate?.("appointments")}
        className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-primary via-info to-info/70 px-3 py-3 text-start shadow-sm transition hover:brightness-110"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] text-white/80">{t("Upcoming Appointment")}</span>
          <span className="block truncate text-xs font-semibold text-white">{summary}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
      </button>
    </section>
  );
}