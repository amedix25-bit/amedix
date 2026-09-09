import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ClinicalNoteCard from "@/components/doctor/notes/ClinicalNoteCard";
import DiagnosisCard from "@/components/doctor/notes/DiagnosisCard";
import { Loader2 } from "lucide-react";

const entryTime = (e) =>
  new Date(e.encounter_datetime || e.created_datetime || e.date || e.created_date || 0).getTime();

// Patient Clinical Notes (Previous History). Clinical notes and diagnoses are
// split by the authoring physician's unique DoctorID: entries authored by the
// currently logged-in doctor appear under "My Clinical Notes", everything else
// under "Other Physicians' Clinical Notes". Both lists are newest first.
export default function DoctorPatientClinicalNotesView({ patientId, doctorId }) {
  const [items, setItems] = useState(null);
  const [imagingMap, setImagingMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!patientId) return;
      try {
        const [notes, diagnoses, imaging] = await Promise.all([
          base44.entities.ClinicalNote.filter({ patient_id: patientId }, "-date"),
          base44.entities.Diagnosis.filter({ patient_id: patientId }, "-created_datetime"),
          base44.entities.ImagingRequest.filter({ patient_id: patientId }),
        ]);
        setItems([
          ...notes.map((n) => ({ ...n, __type: "note" })),
          ...diagnoses.map((d) => ({ ...d, __type: "diagnosis" })),
        ]);
        const map = {};
        imaging.forEach((img) => {
          map[img.id] = img;
        });
        setImagingMap(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  const mine = (items || [])
    .filter((e) => doctorId && e.doctor_id === doctorId)
    .sort((a, b) => entryTime(b) - entryTime(a));
  const others = (items || [])
    .filter((e) => !doctorId || e.doctor_id !== doctorId)
    .sort((a, b) => entryTime(b) - entryTime(a));

  const renderEntry = (e) =>
    e.__type === "diagnosis" ? (
      <DiagnosisCard key={e.id} diagnosis={e} />
    ) : (
      <ClinicalNoteCard key={e.id} note={e} imagingMap={imagingMap} />
    );

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <h4 className="font-semibold text-sm mb-3">Clinical Notes</h4>
      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </div>
      ) : (
        <div className="space-y-5">
          <section>
            <h5 className="text-sm font-semibold mb-2">My Clinical Notes</h5>
            {mine.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clinical notes or diagnoses created by you for this patient.
              </p>
            ) : (
              <div className="space-y-3">{mine.map(renderEntry)}</div>
            )}
          </section>
          <section>
            <h5 className="text-sm font-semibold mb-2">Other Physicians' Clinical Notes</h5>
            {others.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clinical notes or diagnoses from other physicians for this patient.
              </p>
            ) : (
              <div className="space-y-3">{others.map(renderEntry)}</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}