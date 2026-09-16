import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import PatientSearchSelect from "@/components/doctor/patients/PatientSearchSelect";
import SurgicalRecordForm from "@/components/doctor/surgical/SurgicalRecordForm";
import SurgicalRecordView from "@/components/doctor/surgical/SurgicalRecordView";
import { SURGICAL_RECORD_TYPES } from "@/lib/surgicalRecords";
import { Plus, History, ArrowLeft, Search, Loader2, Scissors, FileText } from "lucide-react";

// Surgical Records — the surgeon's replacement for the standard Clinical
// Notes section. Nine structured surgical record types, each with its own
// documentation form; records are saved to the patient's medical record and
// organized chronologically. No separate Surgeon Portal — this lives inside
// the regular Doctor Portal.
export default function SurgicalRecords({ doctorProfile }) {
  const { toast } = useToast();
  const [myPatients, setMyPatients] = useState([]);
  const [mode, setMode] = useState(null); // null | "new" | "history"
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [recordType, setRecordType] = useState(null);

  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [query, setQuery] = useState("");
  const [opened, setOpened] = useState(null);

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
    if (mode !== "history") return;
    setOpened(null);
    setQuery("");
    const load = async () => {
      setLoadingRecords(true);
      try {
        const list = await base44.entities.SurgicalRecord.filter({ doctor_id: doctorProfile.id }, "-record_datetime", 200);
        setRecords(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRecords(false);
      }
    };
    load();
  }, [mode, doctorProfile]);

  const backToOptions = () => {
    setMode(null);
    setSelectedPatient(null);
    setRecordType(null);
    setOpened(null);
  };

  const filtered = query.trim()
    ? records.filter((r) =>
        (r.patient_name || "").toLowerCase().includes(query.trim().toLowerCase())
      )
    : records;

  return (
    <div className="space-y-4">
      {!mode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMode("new")}
            className="rounded-xl border border-border bg-card p-8 text-left hover:border-primary/50 hover:bg-accent/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">New Surgical Record</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select a patient, then choose a record type — consultation, operative note, progress, follow-up and more.
            </p>
          </button>
          <button
            onClick={() => setMode("history")}
            className="rounded-xl border border-border bg-card p-8 text-left hover:border-primary/50 hover:bg-accent/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <History className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg">Records History</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Browse all surgical records you created, organized chronologically.
            </p>
          </button>
        </div>
      )}

      {/* New record: patient selection */}
      {mode === "new" && !selectedPatient && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={backToOptions}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h3 className="font-semibold">New Surgical Record — Select a Patient</h3>
          </div>
          <PatientSearchSelect
            label="Find My Patient"
            patients={myPatients}
            selected={null}
            onSelect={(p) => setSelectedPatient(p)}
          />
        </div>
      )}

      {/* New record: record type selection */}
      {mode === "new" && selectedPatient && !recordType && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h3 className="font-semibold">
              Record Type — <span className="text-muted-foreground font-normal">{selectedPatient.full_name}</span>
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SURGICAL_RECORD_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setRecordType(t)}
                className="rounded-xl border border-border bg-card p-5 text-left hover:border-primary/50 hover:bg-accent/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Scissors className="w-5 h-5" />
                </div>
                <p className="font-semibold text-sm">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New record: structured form */}
      {mode === "new" && selectedPatient && recordType && (
        <SurgicalRecordForm
          doctorProfile={doctorProfile}
          patient={selectedPatient}
          recordType={recordType}
          onSaved={() => {
            toast({
              title: "Surgical record saved",
              description: `${recordType.title} was added to ${selectedPatient.full_name}'s medical record.`,
            });
            setRecordType(null);
            setMode("history");
          }}
          onCancel={() => setRecordType(null)}
        />
      )}

      {/* Chronological history */}
      {mode === "history" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={backToOptions}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <h3 className="font-semibold">Surgical Records History</h3>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpened(null);
                }}
                placeholder="Search by patient name..."
                className="pl-9"
              />
            </div>
          </div>

          {opened ? (
            <div className="space-y-4">
              <Button variant="outline" size="sm" onClick={() => setOpened(null)}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Records
              </Button>
              <SurgicalRecordView record={opened} />
            </div>
          ) : loadingRecords ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No surgical records found</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setOpened(r)}
                  className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.patient_name || "Unknown patient"}</p>
                    <p className="text-xs text-muted-foreground">{r.record_type_title || r.record_type}</p>
                  </div>
                  <p className="text-sm text-muted-foreground shrink-0">
                    {r.record_datetime ? format(new Date(r.record_datetime), "MMM d, yyyy · HH:mm") : ""}
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