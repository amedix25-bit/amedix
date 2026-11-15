import React, { useState } from "react";
import { CalendarDays, Clock, MapPin, Stethoscope, Check } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import PatientAppointmentDetails from "@/components/patient/overview/PatientAppointmentDetails";

export default function PatientNextAppointment({ appointment, onOpenAppointments }) {
  const { t, locale } = usePatientLanguage();
  const [details, setDetails] = useState(false);
  const date = appointment?.date ? new Date(`${appointment.date}T00:00:00`) : null;
  const validDate = date && !Number.isNaN(date.getTime());
  const time = appointment?.time;
  const [hour, minute] = (time || "").split(":");
  const formattedTime = time && Number.isFinite(Number(hour))
    ? new Date(2000, 0, 1, Number(hour), Number(minute || 0)).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })
    : time;
  return <section className="pp-panel pp-appointment">
    <h2 className="pp-panel-heading"><CalendarDays />{t("Upcoming Appointment")}</h2>
    <svg className="pp-appointment-spark" viewBox="0 0 28 24" aria-hidden="true"><path d="M5 11L8 2M11 16L17 7M17 20L25 15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
    {appointment ? <>
      <div className="pp-appointment-body">
        <div className="pp-date-block"><span>{validDate ? date.toLocaleDateString(locale, { weekday: "short" }) : "—"}</span><strong>{validDate ? date.toLocaleDateString(locale, { day: "numeric" }) : "—"}</strong><span>{validDate ? date.toLocaleDateString(locale, { month: "short" }) : ""}</span></div>
        <div className="pp-appointment-info">
          <strong><Stethoscope /><span>{appointment.reason || appointment.doctor_name || t("Appointment")}</span></strong>
          {formattedTime && <p><Clock /><span dir="ltr">{formattedTime}</span></p>}
          {appointment.location && <p><MapPin /><span>{appointment.location}</span></p>}
        </div>
      </div>
      <div className="pp-appointment-buttons"><button type="button" onClick={() => setDetails(true)}><Check />{t("View Details")}</button><button type="button" onClick={onOpenAppointments}><CalendarDays />{t("Manage Appointment")}</button></div>
    </> : <p className="pp-empty">{t("No upcoming appointment")}</p>}
    <PatientAppointmentDetails appointment={appointment} open={details} onOpenChange={setDetails} onManage={onOpenAppointments} />
  </section>;
}