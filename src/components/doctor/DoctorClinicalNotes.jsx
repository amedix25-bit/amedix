import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import ClinicalNoteForm from "@/components/doctor/notes/ClinicalNoteForm";
import ClinicalNoteCard from "@/components/doctor/notes/ClinicalNoteCard";
import DoctorPatientClinicalNotesView from "@/components/doctor/DoctorPatientClinicalNotesView";
import PatientSearchSelect from "@/components/doctor/patients/PatientSearchSelect";
import { FileText, Plus } from "lucide-react";

export default function DoctorClinicalNotes({ doctorProfile, onNavigateTab }) {
  const [items, setItems] = useState([]);
  const [imagingMap, setImagingMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [myPatients, setMyPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    load();
    loadPatients();
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

  const loadPatients = async () => {
    try {
      const accessReqs = await base44.entities.AccessRequest.filter({ doctor_id: doctorProfile.id, status: "approved" });
      const seen = new Set();
      const profiles = [];
      await Promise.all(
        accessReqs.map(async (r) => {
          if (seen.has(r.patient_id)) return;
          seen.add(r.patient_id);
          const result = await base44.entities.PatientProfile.filter({ id: r.patient_id });
          if (result.length > 0) profiles.push(result[0]);
        })
      );
      setMyPatients(profiles);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <PatientSearchSelect
          label="Find My Patient"
          patients={myPatients}
          selected={selectedPatient}
          onSelect={(p) => setSelectedPatient(p)}
        />
      </div>

      {selectedPatient ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="font-semibold">{selectedPatient.full_name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">CIN: {selectedPatient.cin}</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedPatient(null)}>Back to All Notes</Button>
          </div>
          <DoctorPatientClinicalNotesView patientId={selectedPatient.id} />
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}