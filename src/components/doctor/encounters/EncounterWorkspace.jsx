import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import DocumentCard from "./DocumentCard";
import DocumentForm from "./DocumentForm";
import ConsentSection from "./ConsentSection";
import { getEncounterTypeLabel, groupDocumentFamilies } from "@/lib/clinicalDocuments";
import { format } from "date-fns";
import { ArrowLeft, Plus, CheckCircle2, Loader2, FileText, Minus } from "lucide-react";

// The encounter workspace — everything that happened in one encounter: its
// clinical documents (with version control and signatures), consents, and the
// encounter status (active → completed).
export default function EncounterWorkspace({ encounter, doctorProfile, patient, documents, consents, onBack, onRefresh }) {
  const { toast } = useToast();
  const [newDoc, setNewDoc] = useState(false);
  const [amendOf, setAmendOf] = useState(null);
  const [completing, setCompleting] = useState(false);

  const encounterDocs = documents.filter((d) => d.encounter_id === encounter.encounter_id);
  const families = groupDocumentFamilies(encounterDocs);
  const encounterConsents = consents.filter((c) => c.encounter_id === encounter.encounter_id);

  const completeEncounter = async () => {
    setCompleting(true);
    try {
      await base44.functions.invoke("updateEncounterStatus", {
        encounter_record_id: encounter.id,
        status: "completed",
      });
      toast({ title: "Visit completed", description: `Patient visit ${encounter.encounter_id} is now closed.` });
      onRefresh();
    } catch (err) {
      toast({ title: "Could not complete the encounter", description: err.response?.data?.error || "", variant: "destructive" });
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to encounters
      </Button>

      {/* Encounter header */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Visit ID</p>
            <p className="font-bold text-primary">{encounter.encounter_id}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${encounter.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {encounter.status}
            </span>
            {encounter.status === "active" && (
              <Button size="sm" variant="outline" onClick={completeEncounter} disabled={completing}>
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Complete Patient Visit
              </Button>
            )}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 mt-4 text-xs text-muted-foreground">
          <p>Type: <span className="text-foreground font-medium">{getEncounterTypeLabel(encounter.encounter_type)}</span></p>
          <p>Hospital/Clinic: <span className="text-foreground font-medium">{encounter.hospital}</span></p>
          <p>Department: <span className="text-foreground font-medium">{encounter.department || "-"}</span></p>
          <p>Doctor: <span className="text-foreground font-medium">Dr. {encounter.doctor_name}</span></p>
          <p>Specialty: <span className="text-foreground font-medium">{encounter.doctor_specialty || "-"}</span></p>
          <p>Date/Time: <span className="text-foreground font-medium">{encounter.encounter_datetime ? format(new Date(encounter.encounter_datetime), "MMM d, yyyy · h:mm a") : ""}</span></p>
        </div>
        {encounter.chief_complaint && (
          <p className="text-sm mt-3"><span className="text-muted-foreground">Chief complaint:</span> {encounter.chief_complaint}</p>
        )}
      </div>

      {/* Clinical documents of this encounter */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Clinical Documents ({families.length})
          </h3>
          <Button variant="outline" size="sm" onClick={() => { setNewDoc((s) => !s); setAmendOf(null); }}>
            {newDoc ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {newDoc ? "Close" : "New Document"}
          </Button>
        </div>

        {newDoc && (
          <DocumentForm
            doctorProfile={doctorProfile}
            patient={patient}
            encounter={encounter}
            onSaved={() => { setNewDoc(false); onRefresh(); }}
            onCancel={() => setNewDoc(false)}
          />
        )}
        {amendOf && (
          <DocumentForm
            doctorProfile={doctorProfile}
            patient={patient}
            encounter={encounter}
            amendOf={amendOf}
            onSaved={() => { setAmendOf(null); onRefresh(); }}
            onCancel={() => setAmendOf(null)}
          />
        )}

        {families.length === 0 ? (
          <p className="text-sm text-muted-foreground">No clinical documents in this encounter yet.</p>
        ) : (
          <div className="space-y-4">
            {families.map((family) => (
              <DocumentCard
                key={family[0].id}
                doc={family[0]}
                versions={family}
                doctorProfile={doctorProfile}
                onAmend={setAmendOf}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </div>

      {/* Consents recorded in this encounter */}
      <ConsentSection
        doctorProfile={doctorProfile}
        patient={patient}
        encounter={encounter}
        consents={encounterConsents}
        onRefresh={onRefresh}
      />
    </div>
  );
}