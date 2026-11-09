import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, Calendar, FileText, Pill, FlaskConical, Image as ImageIcon, BookOpen } from "lucide-react";

// Quick Access — one tap to each part of the doctor's working day.
const buildTiles = (notesLabel) => [
  { key: "search", label: "My Patients", icon: Users, chip: "bg-blue-50 text-blue-600" },
  { key: "appointments", label: "Appointments", icon: Calendar, chip: "bg-violet-50 text-violet-600" },
  { key: "notes", label: notesLabel || "Clinical Notes", icon: FileText, chip: "bg-sky-50 text-sky-600" },
  { key: "prescriptions", label: "Prescriptions", icon: Pill, chip: "bg-emerald-50 text-emerald-600" },
  { key: "labs", label: "Lab Requests", icon: FlaskConical, chip: "bg-amber-50 text-amber-600" },
  { key: "imaging", label: "Imaging", icon: ImageIcon, chip: "bg-indigo-50 text-indigo-600" },
  { key: "guidelines", label: "Clinical Guidelines", icon: BookOpen, chip: "bg-slate-100 text-slate-600" },
];

export default function QuickAccessGrid({ onNavigate, notesLabel }) {
  const navigate = useNavigate();

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">Quick Access</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {buildTiles(notesLabel).map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => (tile.key === "guidelines" ? navigate("/clinical-references") : onNavigate?.(tile.key))}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-center transition-shadow hover:shadow-sm"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tile.chip}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium leading-tight text-foreground">{tile.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}