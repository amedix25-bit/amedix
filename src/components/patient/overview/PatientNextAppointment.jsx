import React from "react";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

const formatDay = (date) => {
  if (!date) return "—";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};

const formatTime = (time) => {
  if (!time) return "";
  const [h, m] = String(time).split(":");
  const hour = Number(h);
  if (Number.isNaN(hour)) return time;
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m || "00"} ${suffix}`;
};

// The patient's next scheduled visit — date, time and place, with the two
// actions that open the appointments section.
export default function PatientNextAppointment({ appointment, onOpenAppointments }) {
  const { t } = usePatientLanguage();

  return (
    <div className="pp-glass p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-patient-accent/12 text-patient-accent">
          <CalendarDays className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-bold text-patient-ink">{t("Upcoming Appointment")}</h2>
      </div>

      {appointment ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <p className="flex items-center gap-2 text-lg font-bold text-patient-ink">
              <Clock className="h-4 w-4 text-patient-accent" />
              {formatDay(appointment.date)}
              {appointment.time ? `, ${formatTime(appointment.time)}` : ""}
            </p>
            {appointment.doctor_name && (
              <p className="text-sm font-medium text-patient-muted">{appointment.doctor_name}</p>
            )}
          </div>
          {appointment.location && (
            <p className="mt-2 flex items-center gap-2 text-sm text-patient-muted">
              <MapPin className="h-4 w-4 shrink-0 text-patient-teal" />
              {appointment.location}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenAppointments}
              className="rounded-xl bg-patient-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-patient-accent/90"
            >
              {t("View Details")}
            </button>
            <button
              type="button"
              onClick={onOpenAppointments}
              className="rounded-xl border border-patient-accent/30 px-4 py-2 text-sm font-semibold text-patient-accent transition-colors hover:bg-patient-accent/8"
            >
              {t("Manage Appointment")}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-patient-muted">{t("No upcoming appointment")}</p>
          <button
            type="button"
            onClick={onOpenAppointments}
            className="mt-4 rounded-xl bg-patient-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-patient-accent/90"
          >
            {t("Book Appointment")}
          </button>
        </>
      )}
    </div>
  );
}