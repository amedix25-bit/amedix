import React from "react";
import { usePatientLanguage } from "@/lib/patientLanguage";

// The four counters the patient acts on most — laboratory, imaging,
// medications and messages — each opening its own section of the portal.
// The illustrations are the designed AMedix artwork, kept as image assets so
// their shape and proportions are never redrawn or replaced by an icon.
const ILLUSTRATIONS = {
  labs: "https://base44.app/api/apps/6a9ea24b809f9bb40f0d02bf/files/mp/public/6a9ea24b809f9bb40f0d02bf/77ea0d912_labs-3d.png",
  imaging: "https://base44.app/api/apps/6a9ea24b809f9bb40f0d02bf/files/mp/public/6a9ea24b809f9bb40f0d02bf/b8622cfa9_imaging-3d.png",
  medications: "https://base44.app/api/apps/6a9ea24b809f9bb40f0d02bf/files/mp/public/6a9ea24b809f9bb40f0d02bf/814bd0806_medications-3d.png",
  messages: "https://base44.app/api/apps/6a9ea24b809f9bb40f0d02bf/files/mp/public/6a9ea24b809f9bb40f0d02bf/0d6b9e347_messages-3d.png",
};

export default function PatientQuickActions({ labs, imaging, medications, messages, onNavigate }) {
  const { t } = usePatientLanguage();

  const tiles = [
    { key: "labs", label: t("Lab Tests"), count: labs, tone: "bg-[#DCEBFA] hover:bg-[#D3E5F8]" },
    { key: "imaging", label: t("Imaging"), count: imaging, tone: "bg-[#DAF2F1] hover:bg-[#CEEEEC]" },
    { key: "medications", label: t("Medications"), count: medications, tone: "bg-[#FBE4E0] hover:bg-[#F9DAD5]" },
    { key: "messages", label: t("Messages"), count: messages, tone: "bg-[#E9E4F9] hover:bg-[#E1DAF6]" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {tiles.map((tile) => (
        <button
          key={tile.key}
          type="button"
          onClick={() => onNavigate(tile.key)}
          className={`group flex items-center justify-between gap-2 rounded-2xl border border-white/70 p-3 text-left shadow-[0_10px_26px_-20px_hsl(213_60%_20%/0.4)] transition-transform hover:-translate-y-0.5 sm:p-4 ${tile.tone}`}
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-patient-ink">{tile.label}</span>
            <span className="mt-1 block text-xs font-medium text-patient-muted">
              {t("{count} total", { count: tile.count ?? 0 })}
            </span>
          </span>
          <img
            src={ILLUSTRATIONS[tile.key]}
            alt=""
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded-xl object-contain transition-transform group-hover:scale-105 sm:h-16 sm:w-16"
          />
        </button>
      ))}
    </div>
  );
}