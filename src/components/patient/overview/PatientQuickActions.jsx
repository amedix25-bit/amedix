import React from "react";
import { ChevronRight, FlaskConical, MessageSquare, Pill, ScanLine } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

// The four counters the patient acts on most — laboratory, imaging,
// medications and messages — each opening its own section of the portal.
export default function PatientQuickActions({ labs, imaging, medications, messages, onNavigate }) {
  const { t } = usePatientLanguage();

  const tiles = [
    { key: "labs", label: t("Lab Tests"), count: labs, icon: FlaskConical, tone: "bg-patient-teal/12 text-patient-teal" },
    { key: "imaging", label: t("Imaging"), count: imaging, icon: ScanLine, tone: "bg-patient-accent/12 text-patient-accent" },
    { key: "medications", label: t("Medications"), count: medications, icon: Pill, tone: "bg-patient-green/12 text-patient-green" },
    { key: "messages", label: t("Messages"), count: messages, icon: MessageSquare, tone: "bg-patient-amber/16 text-patient-amber" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <button
            key={tile.key}
            type="button"
            onClick={() => onNavigate(tile.key)}
            className="pp-glass group flex flex-col items-start p-4 text-left transition-transform hover:-translate-y-0.5"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tile.tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="mt-3 text-sm font-bold text-patient-ink">{tile.label}</span>
            <span className="mt-1 flex w-full items-center justify-between gap-1 text-xs font-medium text-patient-muted">
              {t("{count} total", { count: tile.count ?? 0 })}
              <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
            </span>
          </button>
        );
      })}
    </div>
  );
}