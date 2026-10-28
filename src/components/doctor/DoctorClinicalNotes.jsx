import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import ClinicalNoteForm from "@/components/doctor/notes/ClinicalNoteForm";
import ClinicalNoteCard from "@/components/doctor/notes/ClinicalNoteCard";
import DiagnosisForm from "@/components/doctor/notes/DiagnosisForm";
import PatientSearchSelect from "@/components/doctor/patients/PatientSearchSelect";
import DoctorPatientSummary from "@/components/doctor/patients/DoctorPatientSummary";
import DoctorMedicationForm from "@/components/doctor/medications/DoctorMedicationForm";
import { useToast } from "@/components/ui/use-toast";
import { Plus, FileText, ArrowLeft, Search, Loader2, Pill, Stethoscope } from "lucide-react";

export default function DoctorClinicalNotes({ doctorProfile, onNavigateTab, returnPatient }) {
  const { toast } = useToast();
  const [myPatients, setMyPatients] = useState([]);
  const [mode, setMode] = useState(returnPatient ? "create" : null);
  const [selectedPatient, setSelectedPatient] = useState(returnPatient || null);
  const [createView, setCreateView] = useState(returnPatient ? "note" : "summary");

  const [prevNotes, setPrevNotes] = useState([]);
  const [prevImagingMap, setPrevImagingMap] = useState({});
  const [prevLoading, setPrevLoading] = useState(false);
  const [prevQuery, setPrevQuery] = useState("");
  const [openedNote, setOpenedNote] = useState(null);

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

  useEffect(() => {
    if (mode !== "previous") return;
    setOpenedNote(null);
    setPrevQuery("");
    const load = async () => {
      setPrevLoading(true);
      try {
        const [notesRes, imaging] = await Promise.all([
          base44.functions.invoke("doctorMyClinicalNotes", {}),
          base44.entities.ImagingRequest.filter({ doctor_id: doctorProfile.id }),
        ]);
        setPrevNotes(notesRes.data.notes || []);
        const map = {};
        imaging.forEach((img) => {
          map[img.id] = img;
        });
        setPrevImagingMap(map);
      } catch (err) {
        console.error(err);
      } finally {
        setPrevLoading(false);
      }
    };
    load();
  }, [mode, doctorProfile]);

  const openMode = (m) => {
    setMode(m);
    setSelectedPatient(null);
    setCreateView("summary");
  };

  const backToOptions = () => {
    setMode(null);
    setSelectedPatient(null);
    setCreateView("summary");
    setOpenedNote(null);
  };

  const filtered = prevQuery.trim()
    ? prevNotes.filter((n) =>
        (n.patient_name || "").toLowerCase().includes(prevQuery.trim().toLowerCase())
      )
    : prevNotes;

  return (
    <div className="space-y-4">
      {!mode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <p className="text-sm text-muted-foreground mt-1">Browse and search your previously written clinical notes.</p>
          </button>
          <button
            onClick={() => openMode("diagnosis")}
            className="rounded-xl border border-border bg-card p-8 text-left hover:border-primary/50 hover:bg-accent/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">Add Diagnosis</h3>
            <p className="text-sm text-muted-foreground mt-1">Search and select a patient, then record and save a diagnosis.</p>
          </button>
        </div>
      )}

      {mode === "create" && !selectedPatient && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={backToOptions}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h3 className="font-semibold">Create New Note — Select a Patient</h3>
          </div>
          <PatientSearchSelect
            label="Find My Patient"
            patients={myPatients}
            selected={null}
            onSelect={(p) => {
              setSelectedPatient(p);
              setCreateView("summary");
            }}
          />
        </div>
      )}

      {mode === "create" && selectedPatient && createView === "summary" && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={backToOptions}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <DoctorPatientSummary patient={selectedPatient} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setCreateView("note")}>
              <FileText className="w-4 h-4 mr-1" />
              Write Clinical Note
            </Button>
            <Button variant="outline" onClick={() => setCreateView("medication")}>
              <Pill className="w-4 h-4 mr-1" />
              Add Medication
            </Button>
          </div>
        </div>
      )}

      {mode === "create" && selectedPatient && createView === "note" && (
        <ClinicalNoteForm
          doctorProfile={doctorProfile}
          onNavigateTab={onNavigateTab}
          preselectedPatient={selectedPatient}
          onSaved={() => {
            setSelectedPatient(null);
            setMode("previous");
          }}
          onCancel={backToOptions}
        />
      )}

      {mode === "create" && selectedPatient && createView === "medication" && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setCreateView("summary")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <DoctorMedicationForm
            patient={selectedPatient}
            onSaved={() => setCreateView("summary")}
            onCancel={() => setCreateView("summary")}
          />
        </div>
      )}

      {mode === "diagnosis" && !selectedPatient && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={backToOptions}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h3 className="font-semibold">Add Diagnosis — Select a Patient</h3>
          </div>
          <PatientSearchSelect
            label="Find My Patient"
            patients={myPatients}
            selected={null}
            onSelect={(p) => setSelectedPatient(p)}
          />
        </div>
      )}

      {mode === "diagnosis" && selectedPatient && (
        <DiagnosisForm
          doctorProfile={doctorProfile}
          patient={selectedPatient}
          onSaved={() => {
            toast({
              title: "Diagnosis saved",
              description: "It now appears in the patient's Previous History under Clinical Notes.",
            });
            backToOptions();
          }}
          onCancel={() => setSelectedPatient(null)}
        />
      )}

      {mode === "previous" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={backToOptions}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <h3 className="font-semibold">Previous Notes</h3>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={prevQuery}
                onChange={(e) => {
                  setPrevQuery(e.target.value);
                  setOpenedNote(null);
                }}
                placeholder="Search by patient name..."
                className="pl-9"
              />
            </div>
          </div>

          {openedNote ? (
            <div className="space-y-4">
              <Button variant="outline" size="sm" onClick={() => setOpenedNote(null)}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Notes
              </Button>
              <ClinicalNoteCard key={openedNote.id} note={openedNote} imagingMap={prevImagingMap} defaultOpen />
            </div>
          ) : prevLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No previous notes found</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {filtered.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setOpenedNote(n)}
                  className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-accent/50 transition-colors"
                >
                  <p className="font-medium truncate">{n.patient_name || "Unknown patient"}</p>
                  <p className="text-sm text-muted-foreground shrink-0">
                    {n.date ? format(new Date(n.date), "MMMM d, yyyy") : ""}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}