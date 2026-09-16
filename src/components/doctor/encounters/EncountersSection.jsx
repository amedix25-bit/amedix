import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import PatientSearchSelect from "@/components/doctor/patients/PatientSearchSelect";
import EncounterForm from "./EncounterForm";
import EncounterWorkspace from "./EncounterWorkspace";
import DocumentCard from "./DocumentCard";
import DocumentForm from "./DocumentForm";
import GrowthChart from "./GrowthChart";
import { getEncounterTypeLabel, groupDocumentFamilies } from "@/lib/clinicalDocuments";
import { format } from "date-fns";
import { Plus, Loader2, ClipboardList, FileText, Activity, ChevronDown, ChevronRight, Stethoscope } from "lucide-react";

// The Encounters section — the core clinical workflow:
// Patient → Encounter (hospital/department/doctor/specialty) → Clinical
// Documents / Consents → Longitudinal Patient Record. One unified record per
// patient; every doctor, any specialty, documents through the same system.
export default function EncountersSection({ doctorProfile }) {
  const { toast } = useToast();
  const [myPatients, setMyPatients] = useState([]);
  const [patient, setPatient] = useState(null);
  const [record, setRecord] = useState(null); // { encounters, documents, consents }
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [creatingEncounter, setCreatingEncounter] = useState(false);
  const [openEncounter, setOpenEncounter] = useState(null);
  const [expandedFamily, setExpandedFamily] = useState(null);
  const [amendOf, setAmendOf] = useState(null);

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

  // Server-side record read — verifies the doctor's approved access to this
  // patient and records the view in the clinical audit log.
  const selectPatient = async (p) => {
    setPatient(p);
    setRecord(null);
    setOpenEncounter(null);
    setExpandedFamily(null);
    setCreatingEncounter(false);
    setLoadingRecord(true);
    try {
      const res = await base44.functions.invoke("getPatientClinicalRecord", {
        patient_id: p.id,
        doctor_id: doctorProfile.id,
      });
      setPatient(res.data.patient);
      setRecord({ encounters: res.data.encounters, documents: res.data.documents, consents: res.data.consents });
    } catch (err) {
      toast({
        title: "Could not open the patient record",
        description: err.response?.data?.error || "Please try again.",
        variant: "destructive",
      });
      setPatient(null);
    } finally {
      setLoadingRecord(false);
    }
  };

  // Refresh after clinical actions — plain reads, no extra audit "view" entry.
  const refreshRecord = async () => {
    if (!patient) return;
    try {
      const [encounters, documents, consents] = await Promise.all([
        base44.entities.Encounter.filter({ patient_id: patient.id }, "-encounter_datetime", 200),
        base44.entities.ClinicalDocument.filter({ patient_id: patient.id }, "-created_datetime", 500),
        base44.entities.Consent.filter({ patient_id: patient.id }, "-consent_datetime", 200),
      ]);
      setRecord({ encounters, documents, consents });
      if (openEncounter) {
        const fresh = encounters.find((e) => e.id === openEncounter.id);
        setOpenEncounter(fresh || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const families = groupDocumentFamilies(record?.documents);
  const activeEncounters = (record?.encounters || []).filter((e) => e.status === "active");

  // ===== Patient selection =====
  if (!patient) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-primary" />
          Encounters — Select a Patient
        </h3>
        <p className="text-sm text-muted-foreground">
          Open a patient's unified clinical record: encounters, clinical documents, consents and the longitudinal history.
        </p>
        <PatientSearchSelect label="Find My Patient" patients={myPatients} selected={null} onSelect={selectPatient} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => { setPatient(null); setRecord(null); setOpenEncounter(null); }}>
        &larr; Select a different patient
      </Button>

      {/* Patient header */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="font-semibold text-lg">{patient.full_name}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
          <p>CIN: <span className="text-foreground font-medium">{patient.cin}</span></p>
          {patient.date_of_birth && <p>DOB: <span className="text-foreground font-medium">{patient.date_of_birth}</span></p>}
          {patient.blood_type && patient.blood_type !== "Unknown" && <p>Blood type: <span className="text-foreground font-medium">{patient.blood_type}</span></p>}
        </div>
      </div>

      {loadingRecord && (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Opening the clinical record...
        </div>
      )}

      {!loadingRecord && record && !openEncounter && (
        <>
          {/* Active encounters */}
          {activeEncounters.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-primary mb-2">
                {activeEncounters.length} active encounter{activeEncounters.length > 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {activeEncounters.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => { setOpenEncounter(e); setExpandedFamily(null); }}
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
              New Encounter
            </Button>
          )}

          {/* All encounters — chronological */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Encounters ({record.encounters.length})
            </h3>
            {record.encounters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No encounters yet — open the first one above.</p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {record.encounters.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => { setOpenEncounter(e); setExpandedFamily(null); }}
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

          {/* Longitudinal record — every clinical document, chronological */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Longitudinal Record — All Clinical Documents ({families.length})
            </h3>
            {families.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clinical documents yet.</p>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                {families.map((family) => {
                  const latest = family[0];
                  return (
                    <div key={latest.document_id} className="border-b border-border last:border-b-0">
                      <button
                        onClick={() => setExpandedFamily(expandedFamily === latest.document_id ? null : latest.document_id)}
                        className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {expandedFamily === latest.document_id ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{latest.document_type_label || latest.document_type}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {latest.encounter_id} · v{latest.version} · {latest.status}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0">
                          {latest.created_datetime ? format(new Date(latest.created_datetime), "MMM d, yyyy · h:mm a") : ""}
                        </p>
                      </button>
                      {expandedFamily === latest.document_id && (
                        <div className="px-3 pb-3">
                          {amendOf && amendOf.document_id === latest.document_id ? (
                            <DocumentForm
                              doctorProfile={doctorProfile}
                              patient={patient}
                              encounter={{ encounter_id: latest.encounter_id, department: latest.department }}
                              amendOf={amendOf}
                              onSaved={() => { setAmendOf(null); refreshRecord(); }}
                              onCancel={() => setAmendOf(null)}
                            />
                          ) : (
                            <DocumentCard
                              doc={latest}
                              versions={family}
                              doctorProfile={doctorProfile}
                              onAmend={setAmendOf}
                              onRefresh={refreshRecord}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {doctorProfile.specialization === "Pediatrics" && (
            <GrowthChart documents={record.documents} />
          )}
        </>
      )}

      {!loadingRecord && record && openEncounter && (
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