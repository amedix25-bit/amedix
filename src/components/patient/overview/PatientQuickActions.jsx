import React from "react";
import { FlaskConical, Image as ImageIcon, Pill, Mail, ChevronRight } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";
import PatientReferenceArt from "@/components/patient/overview/PatientReferenceArt";

export default function PatientQuickActions({ labs, imaging, medications, messages, onNavigate }) {
  const { t } = usePatientLanguage();
  const tiles = [
    { key: "labs", label: "Lab Tests", count: labs, icon: FlaskConical, tone: "pp-tone-blue" },
    { key: "imaging", label: "Imaging", count: imaging, icon: ImageIcon, tone: "pp-tone-mint" },
    { key: "medications", label: "Medications", count: medications, icon: Pill, tone: "pp-tone-coral" },
    { key: "messages", label: "Messages", count: messages, icon: Mail, tone: "pp-tone-violet" },
  ];
  return <div className="pp-action-grid">
    {tiles.map(({ key, label, count, icon: Icon, tone }) => <button key={key} type="button" onClick={() => onNavigate(key)} className={`pp-panel pp-action-card ${tone}`}>
      <span className="pp-action-copy"><Icon /><strong>{count ?? 0}</strong><span>{t(label)}<ChevronRight className="rtl:rotate-180" /></span></span>
      <PatientReferenceArt kind={key} className="pp-action-art" />
    </button>)}
  </div>;
}