import React from "react";
import {
  CalendarPlus,
  Download,
  FlaskConical,
  Pill,
  ScanLine,
  FolderOpen,
} from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

// The six shortcuts at the foot of the dashboard — each one opens an existing
// section of the portal.
export default function PatientQuickAccess({ onNavigate }) {
  const { t } = usePatientLanguage();

  const items = [
    { key: "appointments", label: t("Book Appointment"), icon: CalendarPlus, tone: "bg-patient-accent/12 text-patient-accent" },
    { key: "mylabresults", label: t("View Lab Results"), icon: FlaskConical, tone: "bg-patient-teal/12 text-patient-teal" },
    { key: "imaging", label: t("View Imaging"), icon: ScanLine, tone: "bg-patient-purple/12 text-patient-purple" },
    { key: "medications", label: t("Manage Medications"), icon: Pill, tone: "bg-patient-green/12 text-patient-green" },
    { key: "health", label: t("My Medical Record"), icon: FolderOpen, tone: "bg-patient-amber/16 text-patient-amber" },
    { key: "documents", label: t("Download Reports"), icon: Download, tone: "bg-patient-ink/10 text-patient-ink" },
  ];

  return (
    <div className="pp-glass grid grid-cols-3 gap-2 p-3 lg:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onNavigate(item.key)}
            className="flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center transition-colors hover:bg-patient-canvas/70"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-semibold leading-tight text-patient-ink">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}