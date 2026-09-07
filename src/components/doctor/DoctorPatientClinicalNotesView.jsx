import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ClinicalNoteCard from "@/components/doctor/notes/ClinicalNoteCard";
import { Loader2 } from "lucide-react";

export default function DoctorPatientClinicalNotesView({ patientId }) {
  const [items, setItems] = useState([]);
  const [imagingMap, setImagingMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!patientId) return;
      try {
        const [notes, imaging] = await Promise.all([
          base44.entities.ClinicalNote.filter({ patient_id: patientId }, "-date"),
          base44.entities.ImagingRequest.filter({ patient_id: patientId }),
        ]);
        setItems(notes);
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

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <h4 className="font-semibold text-sm mb-3">Clinical Notes</h4>
      {loading ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No clinical notes recorded for this patient.</p>
      ) : (
        <div className="space-y-3">
          {items.map((note) => (
            <ClinicalNoteCard key={note.id} note={note} imagingMap={imagingMap} />
          ))}
        </div>
      )}
    </div>
  );
}