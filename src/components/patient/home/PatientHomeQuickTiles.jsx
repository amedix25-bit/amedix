import React from "react";
import { CalendarDays, ChevronRight, FileText, FlaskConical, FolderPlus, Pill, ScanLine } from "lucide-react";
import { usePatientLanguage } from "@/lib/patientLanguage";

const TILES = [
  { key: "health", label: "Medical Records", hint: "View your records", Icon: FolderPlus },
  { key: "appointments", label: "Appointments", hint: "Book or manage", Icon: CalendarDays },
  { key: "drugs", label: "Prescriptions", hint: "View your meds", Icon: Pill },
  { key: "labs", label: "Laboratory Results", hint: "Check your results", Icon: FlaskConical },
  { key: "imaging", label: "Radiology & Imaging", hint: "View your images", Icon: ScanLine },
  { key: "documents", label: "Medical Reports", hint: "Access your reports", Icon: FileText },
];

export default function PatientHomeQuickTiles({ onNavigate }) {
  const { t } = usePatientLanguage();

  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-bold text-patient-ink sm:text-lg">{t("Your Healthcare")}</h2>
        <button
          type="button"
          onClick={() => onNavigate?.("health")}
          className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-info"
        >
          {t("View All")}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {TILES.map(({ key, label, hint, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate?.(key)}
            className="relative flex flex-col items-start gap-2.5 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 p-3 text-start shadow-sm transition hover:brightness-105 sm:p-3.5"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/25 text-white sm:h-10 sm:w-10">
              <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" aria-hidden="true" />
            </span>
            <span className="text-xs font-bold leading-snug text-white sm:text-[13px]">{t(label)}</span>
            <span className="pe-4 text-[10px] leading-snug text-white/85 sm:text-[11px]">{t(hint)}</span>
            <ChevronRight className="absolute bottom-3 end-2.5 h-4 w-4 text-white/80" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}