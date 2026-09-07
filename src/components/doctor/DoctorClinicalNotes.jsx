import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import ClinicalNoteForm from "@/components/doctor/notes/ClinicalNoteForm";
import ClinicalNoteCard from "@/components/doctor/notes/ClinicalNoteCard";
import { FileText, Plus } from "lucide-react";

export default function DoctorClinicalNotes({ doctorProfile, onNavigateTab }) {
  const [items, setItems] = useState([]);
  const [imagingMap, setImagingMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    load();
  }, [doctorProfile]);

  const load = async () => {
    try {
      const [notes, imaging] = await Promise.all([
        base44.entities.ClinicalNote.filter({ doctor_id: doctorProfile.id }, "-date"),
        base44.entities.ImagingRequest.filter({ doctor_id: doctorProfile.id }),
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Clinical Note
        </Button>
      </div>

      {showForm && (
        <ClinicalNoteForm
          doctorProfile={doctorProfile}
          onNavigateTab={onNavigateTab}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No clinical notes yet</p>
        </div>
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