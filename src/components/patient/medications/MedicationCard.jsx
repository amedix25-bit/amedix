import React from "react";
import { Pill, Pencil } from "lucide-react";
import { medicationStatus, mealLabel, routeLabel } from "@/lib/medicationUtils";

const STATUS_STYLES = {
  active: { label: "Active", classes: "bg-emerald-100 text-emerald-700" },
  completed: { label: "Completed", classes: "bg-muted text-muted-foreground" },
  discontinued: { label: "Discontinued", classes: "bg-red-100 text-red-700" },
};

export default function MedicationCard({ med, today, onEdit }) {
  const status = medicationStatus(med, today);
  const statusStyle = STATUS_STYLES[status];
  const isDoctor = med.source === "doctor_prescribed";

  const rows = [
    { label: "Dose", value: med.dose },
    { label: "Route of Administration", value: med.route ? routeLabel(med.route) : "" },
    { label: "Frequency", value: med.frequency },
    { label: "Meal", value: med.meal_timing ? mealLabel(med.meal_timing) : "" },
    { label: "Duration", value: med.duration },
    { label: isDoctor ? "Doctor's Notes" : "Notes", value: isDoctor ? med.doctor_notes : med.patient_notes },
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
                {statusStyle.label}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isDoctor ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {isDoctor ? "Doctor-Prescribed" : "Patient-Reported"}
              </span>
            </div>
            {med.start_date && (
              <p className="text-xs text-muted-foreground mt-0.5">Started {med.start_date}</p>
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