import React from "react";
import { CalendarDays, FileText, FlaskConical, Pill, Image as ImageIcon, FolderClosed, Zap } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function PatientQuickAccess({ onNavigate }) {
  const { t } = usePatientLanguage();
  const items = [
    { key: "appointments", label: "View Appointment", icon: CalendarDays, tone: "pp-tone-blue" },
    { key: "mylabresults", label: "View Lab Results", icon: FlaskConical, tone: "pp-tone-violet" },
    { key: "imaging", label: "View Imaging", icon: ImageIcon, tone: "pp-tone-mint" },
    { key: "medications", label: "Manage Medications", icon: Pill, tone: "pp-tone-coral" },
    { key: "health", label: "My Medical Record", icon: FolderClosed, tone: "pp-tone-gold" },
    { key: "documents", label: "Download Reports", icon: FileText, tone: "pp-tone-indigo" },
  ];
  return <section className="pp-panel pp-access"><h2 className="pp-panel-heading"><Zap />{t("Quick Access")}</h2>
    <div className="pp-shortcut-grid">{items.map(({ key, label, icon: Icon, tone }) => <button key={key} type="button" onClick={() => onNavigate(key)} className={`pp-shortcut ${tone}`}><Icon /><span>{t(label)}</span></button>)}</div>
  </section>;
}