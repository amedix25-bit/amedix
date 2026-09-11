import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Stethoscope } from "lucide-react";
import { capitalize } from "@/lib/patientUtils";
import { usePatientLanguage } from "@/lib/patientLanguage";

export default function MedicalHistorySection({ patientId }) {
  const { t } = usePatientLanguage();
  const [items, setItems] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!patientId) return;
      try {
        const data = await base44.entities.MedicalHistoryEntry.filter({ patient_id: patientId }, "-date");
        setItems(data);
      } catch (err) {
        console.error(err);
        setItems([]);
      }
    };
    load();
  }, [patientId]);

  if (!patientId || items === null || items.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Stethoscope className="w-4 h-4 text-primary" />
        <p className="font-semibold text-sm">{t("Medical History — Encounters")}</p>
      </div>
      <div className="space-y-3">
        {items.map((e) => (
          <div key={e.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">{t("Patient Seen")}</p>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                {t(capitalize(String(e.status || "")))}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm">
              <p><span className="text-muted-foreground">{t("Date")}: </span>{e.date}</p>
              <p><span className="text-muted-foreground">{t("Time")}: </span>{e.time}</p>
              <p><span className="text-muted-foreground">{t("Doctor")}: </span>{e.doctor_name}</p>
              <p><span className="text-muted-foreground">{t("Location")}: </span>{e.location || "—"}</p>
              {e.appointment_reason && (
                <p className="sm:col-span-2"><span className="text-muted-foreground">{t("Appointment")}: </span>{e.appointment_reason}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}