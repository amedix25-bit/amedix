import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import ClinicalNoteForm from "@/components/doctor/notes/ClinicalNoteForm";
import DoctorPatientClinicalNotesView from "@/components/doctor/DoctorPatientClinicalNotesView";
import PatientSearchSelect from "@/components/doctor/patients/PatientSearchSelect";
import { Plus, FileText } from "lucide-react";

export default function DoctorClinicalNotes({ doctorProfile, onNavigateTab }) {
  const [myPatients, setMyPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [view, setView] = useState(null);

  useEffect(() => {
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
    loadPatients();
  }, [doctorProfile]);

  const handleSelect = (p) => {
    setSelectedPatient(p);
    setView(null);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <PatientSearchSelect
          label="Find My Patient"
          patients={myPatients}
          selected={selectedPatient}
          onSelect={handleSelect}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!selectedPatient}
            variant={view === "create" ? "default" : "outline"}
            onClick={() => setView(view === "create" ? null : "create")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Note
          </Button>
          <Button
            disabled={!selectedPatient}
            variant={view === "previous" ? "default" : "outline"}
            onClick={() => setView(view === "previous" ? null : "previous")}
          >
            <FileText className="w-4 h-4 mr-2" />
            Previous Notes
          </Button>
        </div>
      </div>

      {selectedPatient && view === "create" && (
        <ClinicalNoteForm
          doctorProfile={doctorProfile}
          onNavigateTab={onNavigateTab}
          preselectedPatient={selectedPatient}
          onSaved={() => setView("previous")}
          onCancel={() => setView(null)}
        />
      )}

      {selectedPatient && view === "previous" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <DoctorPatientClinicalNotesView patientId={selectedPatient.id} />
        </div>
      )}
    </div>
  );
}