import React from "react";
import { Clock, CheckCircle2, Image as ImageIcon, MessageSquareMore, CalendarDays, Pill, Info } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

const TYPES = {
  lab_results: [CheckCircle2, "pp-icon-green", "mylabresults"],
  lab_request: [CheckCircle2, "pp-icon-green", "labs"],
  imaging: [ImageIcon, "pp-icon-purple", "imaging"],
  imaging_results: [ImageIcon, "pp-icon-purple", "imaging"],
  doctor_message: [MessageSquareMore, "pp-icon-blue", "messages"],
  appointment: [CalendarDays, "pp-icon-gold", "appointments"],
  rescheduled: [CalendarDays, "pp-icon-gold", "appointments"],
  medication_update: [Pill, "pp-icon-purple", "medications"],
  medication_reminder: [Pill, "pp-icon-purple", "medications"],
  recall: [Pill, "pp-icon-red", "medications"],
};
export default function PatientRecentActivity({ items, onNavigate, onViewAll }) {
  const { t, locale } = usePatientLanguage();
  return <section className="pp-panel pp-activity">
    <div className="pp-activity-header"><h2 className="pp-panel-heading"><Clock />{t("Recent Activity")}</h2><button type="button" className="pp-view-all" onClick={onViewAll}>{t("View All")}</button></div>
    {!items.length ? <p className="pp-empty">{t("No recent activity")}</p> : <ul className="pp-activity-list">{items.slice(0, 4).map((item) => {
      const [Icon, color, target] = TYPES[item.type] || [Info, "pp-icon-blue", "health"];
      const date = item.created_date ? new Date(item.created_date) : null;
      return <li key={item.id}><button type="button" className={`pp-activity-item ${color}`} onClick={() => onNavigate?.(item.target === "radiology" ? "access" : item.target || target)}>
        <span className="pp-timeline-dot" /><span className="pp-timeline-icon"><Icon /></span>
        <span className="pp-activity-copy"><strong>{t(item.title)}</strong>{item.message && <small title={t(item.message)}>{t(item.message)}</small>}</span>
        <time className="pp-activity-date" dateTime={item.created_date}>{date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(locale, { month: "short", day: "numeric" }) : ""}</time>
      </button></li>;
    })}</ul>}
  </section>;
}