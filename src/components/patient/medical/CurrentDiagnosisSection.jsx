import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import SectionCard from "./SectionCard";
import { Loader2 } from "lucide-react";

export default function CurrentDiagnosisSection({ number, patient }) {
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!patient?.id) return;
      try {
        const notes = await base44.entities.ClinicalNote.filter({ patient_id: patient.id }, "-date");
        setLatest(notes[0] || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patient?.id]);

  return (
    <SectionCard number={number} title="Current Diagnosis">
      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </div>
      ) : !latest ? (
        <p className="text-sm text-muted-foreground">
          No active diagnosis recorded. Diagnoses from your clinical visits will appear here.
        </p>
      ) : (
        <div>
          <p className="font-medium text-sm">{latest.diagnosis}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Diagnosed on {latest.date} · {latest.doctor_name || "Attending doctor"}
          </p>
        </div>
      )}
    </SectionCard>
  );
}