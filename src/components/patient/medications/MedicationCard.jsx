import React from "react";
import { Pill, Pencil } from "lucide-react";
import { medicationStatus, mealLabel, routeLabel } from "@/lib/medicationUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";

const STATUS_STYLES = {
  active: { label: "Active", classes: "bg-emerald-100 text-emerald-700" },
  completed: { label: "Completed", classes: "bg-muted text-muted-foreground" },
  discontinued: { label: "Discontinued", classes: "bg-red-100 text-red-700" },
};

export default function MedicationCard({ med, today, onEdit }) {
  const { t } = usePatientLanguage();
  const status = medicationStatus(med, today);
  const statusStyle = STATUS_STYLES[status];
  const isDoctor = med.source === "doctor_prescribed";

  const rows = [
    { label: t("Dose"), value: med.dose },
    { label: t("Route of Administration"), value: med.route ? t(routeLabel(med.route)) : "" },
    { label: t("Frequency"), value: med.prn ? t("PRN — as needed") : med.frequency },
    { label: t("Max Frequency"), value: med.prn ? med.max_frequency : "" },
    { label: t("Meal"), value: med.meal_timing ? t(mealLabel(med.meal_timing)) : "" },
    { label: t("Duration"), value: med.duration },
    { label: t("End Date"), value: med.end_date },
    { label: t("Indication"), value: med.reason },
    { label: isDoctor ? t("Doctor's Notes") : t("Notes"), value: isDoctor ? med.doctor_notes : med.patient_notes },
    { label: t("Special Instructions"), value: med.special_instructions },
  ].filter((r) => r.value);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{med.name}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle.classes}`}>
                {t(statusStyle.label)}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isDoctor ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {isDoctor ? t("Doctor-Prescribed") : t("Patient-Reported")}
              </span>
            </div>
            {med.start_date && (
              <p className="text-xs text-muted-foreground mt-0.5">{t("Started")} {med.start_date}</p>
            )}
          </div>
        </div>
        {onEdit && (
          <button type="button" onClick={() => onEdit(med)} className="text-muted-foreground hover:text-primary">
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>
      {rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {rows.map((r) => (
            <p key={r.label} className="text-sm">
              <span className="text-muted-foreground">{r.label}: </span>
              <span className="font-medium">{r.value}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}