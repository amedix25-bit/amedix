import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import ClinicalNoteForm from "@/components/doctor/notes/ClinicalNoteForm";
import DoctorPatientClinicalNotesView from "@/components/doctor/DoctorPatientClinicalNotesView";
import PatientSearchSelect from "@/components/doctor/patients/PatientSearchSelect";
import { Plus, FileText, ArrowLeft } from "lucide-react";

export default function DoctorClinicalNotes({ doctorProfile, onNavigateTab }) {
  const [myPatients, setMyPatients] = useState([]);
  const [mode, setMode] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

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

  const openMode = (m) => {
    setMode(m);
    setSelectedPatient(null);
  };

  const backToOptions = () => {
    setMode(null);
    setSelectedPatient(null);
  };

  return (
    <div className="space-y-4">
      {!mode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => openMode("create")}
            className="rounded-xl border border-border bg-card p-8 text-left hover:border-primary/50 hover:bg-accent/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">Create New Note</h3>
            <p className="text-sm text-muted-foreground mt-1">Search and select a patient, then write a new clinical note.</p>
          </button>
          <button
            onClick={() => openMode("previous")}
            className="rounded-xl border border-border bg-card p-8 text-left hover:border-primary/50 hover:bg-accent/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">Previous Notes</h3>
            <p className="text-sm text-muted-foreground mt-1">Search and select a patient to view their previous clinical notes.</p>
          </button>
        </div>
      )}

      {mode && !selectedPatient && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={backToOptions}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h3 className="font-semibold">{mode === "create" ? "Create New Note" : "Previous Notes"} — Select a Patient</h3>
          </div>
          <PatientSearchSelect
            label="Find My Patient"
            patients={myPatients}
            selected={null}
            onSelect={(p) => setSelectedPatient(p)}
          />
        </div>
      )}

      {mode === "create" && selectedPatient && (
        <ClinicalNoteForm
          doctorProfile={doctorProfile}
          onNavigateTab={onNavigateTab}
          preselectedPatient={selectedPatient}
          onSaved={() => setMode("previous")}
          onCancel={backToOptions}
        />
      )}

      {mode === "previous" && selectedPatient && (
        <div className="rounded-xl border border-border bg-card p-5">
          <DoctorPatientClinicalNotesView patientId={selectedPatient.id} />
        </div>
      )}
    </div>
  );
}