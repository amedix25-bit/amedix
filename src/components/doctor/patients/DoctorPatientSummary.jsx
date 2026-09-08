import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User, AlertTriangle, HeartPulse, Pill, Loader2 } from "lucide-react";
import { medicationStatus, todayStr } from "@/lib/medicationUtils";

export default function DoctorPatientSummary({ patient }) {
  const [allergies, setAllergies] = useState(null);
  const [conditions, setConditions] = useState(null);
  const [meds, setMeds] = useState(null);

  useEffect(() => {
    setAllergies(null);
    setConditions(null);
    setMeds(null);
    const load = async () => {
      try {
        const [al, cd, md] = await Promise.all([
          base44.entities.Allergy.filter({ patient_id: patient.id }),
          base44.entities.MedicalCondition.filter({ patient_id: patient.id, category: "known_case" }),
          base44.entities.Medication.filter({ patient_id: patient.id }),
        ]);
        setAllergies(al);
        setConditions(cd);
        setMeds(md.filter((m) => medicationStatus(m, todayStr()) === "active").map((m) => m.name));
      } catch (err) {
        console.error(err);
      }
    };
    if (patient?.id) load();
  }, [patient?.id]);

  const dob = patient?.date_of_birth ? new Date(patient.date_of_birth) : null;
  const age =
    dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

  const allergyList =
    allergies === null
      ? null
      : allergies.length > 0
        ? allergies.map((a) => a.allergen).join(", ")
        : patient.allergies || "None recorded";

  const items = [
    {
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
      label: "Allergies",
      value: allergyList,
    },
    {
      icon: <HeartPulse className="w-4 h-4 text-primary shrink-0 mt-0.5" />,
      label: "Known Conditions",
      value:
        conditions === null
          ? null
          : conditions.length > 0
            ? conditions.map((c) => c.name).join(", ")
            : "None recorded",
    },
    {
      icon: <Pill className="w-4 h-4 text-primary shrink-0 mt-0.5" />,
      label: "Current Medications",
      value: meds === null ? null : meds.length > 0 ? meds.join(", ") : "None",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <User className="w-6 h-6" />
        </div>
        <div>
          <p className="font-semibold text-lg leading-tight">{patient.full_name}</p>
          <p className="text-sm text-muted-foreground">CIN: {patient.cin}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Date of Birth</p>
          <p className="font-medium">
            {patient.date_of_birth || "—"}
            {age !== null ? ` (${age}y)` : ""}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Sex</p>
          <p className="font-medium capitalize">{patient.gender || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Blood Type</p>
          <p className="font-medium">{patient.blood_type || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Phone</p>
          <p className="font-medium">{patient.phone || "—"}</p>
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2 text-sm">
            {item.icon}
            <p>
              <span className="text-muted-foreground">{item.label}: </span>
              {item.value === null ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin inline text-muted-foreground" />
              ) : (
                <span className="font-medium">{item.value}</span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}