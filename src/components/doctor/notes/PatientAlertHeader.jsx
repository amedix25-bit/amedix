import React from "react";
import { AlertTriangle, Pill, Stethoscope } from "lucide-react";

// Compact sticky patient header for the clinical note — critical patient
// information, allergies, active medications and relevant history stay
// visible while the doctor documents any section of the encounter.
export default function PatientAlertHeader({ patient, doctorProfile, meds = [], conditions = [] }) {
  const allergy = (patient.allergies || "").trim();
  return (
    <div className="sticky top-0 z-20">
      <div className="rounded-xl border border-border bg-card/95 backdrop-blur px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="font-semibold text-sm">{patient.full_name}</p>
          <p className="text-xs text-muted-foreground">CIN {patient.cin}</p>
          <p className="text-xs text-muted-foreground">DOB {patient.date_of_birth || "—"}</p>
          <p className="text-xs text-muted-foreground sm:ml-auto">
            Dr. {doctorProfile.full_name} · {doctorProfile.specialization} · {doctorProfile.hospital || "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {allergy ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive border border-destructive/30 px-2 py-0.5 text-xs font-medium">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Allergies: {allergy}
            </span>
          ) : (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">No known allergies</span>
          )}
          {meds.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-xs">
              <Pill className="w-3 h-3 shrink-0" />
              {meds.slice(0, 3).join(", ")}{meds.length > 3 ? ` +${meds.length - 3}` : ""}
            </span>
          ) : (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">No active medications</span>
          )}
          {conditions.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-xs">
              <Stethoscope className="w-3 h-3 shrink-0" />
              {conditions.slice(0, 2).join(", ")}{conditions.length > 2 ? ` +${conditions.length - 2}` : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}