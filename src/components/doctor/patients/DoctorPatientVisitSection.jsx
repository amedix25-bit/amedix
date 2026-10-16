import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import EncounterForm from "@/components/doctor/encounters/EncounterForm";
import EncounterWorkspace from "@/components/doctor/encounters/EncounterWorkspace";
import { getEncounterTypeLabel } from "@/lib/clinicalDocuments";
import { format } from "date-fns";
import { Plus, Loader2, ClipboardList } from "lucide-react";

// The "Patient Visit" tab of the doctor's Find Patient record view — the same
// encounter workflow as the Encounters section, with the patient already
// selected from the record view.
export default function DoctorPatientVisitSection({ patient, doctorProfile }) {
  const { toast } = useToast();
  const [record, setRecord] = useState(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [creatingEncounter, setCreatingEncounter] = useState(false);
  const [openEncounter, setOpenEncounter] = useState(null);

  // Server-side record read — verifies the doctor's approved access to this
  // patient and records the view in the clinical audit log.
  const loadRecord = async () => {
    setLoadingRecord(true);
    setRecord(null);
    setOpenEncounter(null);
    try {
      const res = await base44.functions.invoke("getPatientClinicalRecord", {
        patient_id: patient.id,
        doctor_id: doctorProfile.id,
      });
      setRecord({ encounters: res.data.encounters, documents: res.data.documents, consents: res.data.consents });
    } catch (err) {
      toast({
        title: "Could not open the patient record",
        description: err.response?.data?.error || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingRecord(false);
    }
  };

  // Refresh after clinical actions — plain reads, no extra audit "view" entry.
  const refreshRecord = async () => {
    if (!patient) return;
    try {
      const res = await base44.functions.invoke("doctorPatientMedicalData", { patient_id: patient.id });
      setRecord({
        encounters: res.data.encounters || [],
        documents: res.data.clinical_documents || [],
        consents: res.data.consents || [],
      });
      if (openEncounter) {
        const fresh = encounters.find((e) => e.id === openEncounter.id);
        setOpenEncounter(fresh || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id, doctorProfile?.id]);

  if (loadingRecord) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Opening the clinical record...
      </div>
    );
  }
  if (!record) return null;

  const activeEncounters = record.encounters.filter((e) => e.status === "active");

  return (
    <div className="space-y-4">
      {/* Active encounters */}
      {activeEncounters.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-primary mb-2">
            {activeEncounters.length} active visit{activeEncounters.length > 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {activeEncounters.map((e) => (
              <button
                key={e.id}
                onClick={() => setOpenEncounter(e)}
                className="w-full flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 text-left hover:bg-accent/50 transition-colors"
              >
                <span className="text-sm font-medium">{e.encounter_id} · {getEncounterTypeLabel(e.encounter_type)}</span>
                <span className="text-xs text-muted-foreground">
                  {e.encounter_datetime ? format(new Date(e.encounter_datetime), "MMM d, yyyy · h:mm a") : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New encounter */}
      {creatingEncounter ? (
        <EncounterForm
          doctorProfile={doctorProfile}
          patient={patient}
          onCreated={(encounter) => {
            setCreatingEncounter(false);
            setRecord((r) => ({ ...r, encounters: [encounter, ...(r?.encounters || [])] }));
            setOpenEncounter(encounter);
          }}
          onCancel={() => setCreatingEncounter(false)}
        />
      ) : (
        <Button onClick={() => setCreatingEncounter(true)}>
          <Plus className="w-4 h-4" />
          New Patient Visit
        </Button>
      )}

      {/* All encounters — chronological */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          Patient Visits ({record.encounters.length})
        </h3>
        {record.encounters.length === 0 ? (
          <p className="text-sm text-muted-foreground">No visits yet — start the first one above.</p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {record.encounters.map((e) => (
              <button
                key={e.id}
                onClick={() => setOpenEncounter(e)}
                className="w-full p-3 text-left hover:bg-accent/50 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {e.encounter_id} · {getEncounterTypeLabel(e.encounter_type)}
                    <span className="text-xs text-muted-foreground font-normal ml-2">{e.hospital}{e.department ? ` · ${e.department}` : ""}</span>
                  </p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${e.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {e.status}
                  </span>
                </div>
                {e.chief_complaint && <p className="text-xs text-muted-foreground mt-1 truncate">{e.chief_complaint}</p>}
              </button>
            ))}
          </div>
        )}
      </div>

      {openEncounter && (
        <EncounterWorkspace
          encounter={openEncounter}
          doctorProfile={doctorProfile}
          patient={patient}
          documents={record.documents}
          consents={record.consents}
          onBack={() => setOpenEncounter(null)}
          onRefresh={refreshRecord}
        />
      )}
    </div>
  );
}