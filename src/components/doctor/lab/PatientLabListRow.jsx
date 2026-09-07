import React from "react";
import { ChevronRight } from "lucide-react";

export default function PatientLabListRow({ patient, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-accent/50 transition-colors"
    >
      <div className="min-w-0">
        <p className="font-medium truncate">{patient.patient_name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">CIN: {patient.patient_cin}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}