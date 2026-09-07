import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Pill, Loader2 } from "lucide-react";

export default function PatientMedications({ patientId }) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const notes = await base44.entities.ClinicalNote.filter({ patient_id: patientId }, "-date");
        setMedications(notes.filter((n) => n.prescription && n.prescription.trim()));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (patientId) load();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading medications...
      </div>
    );
  }

  if (medications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <Pill className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No medications yet. Prescriptions written by your authorized doctors will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {medications.map((med) => (
        <div key={med.id} className="rounded-xl border border-border bg-card p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm">{med.prescription}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Prescribed by {med.doctor_name || "your doctor"} · {med.date}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}