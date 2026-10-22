import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, FileText, Image as ImageIcon, Plus, Loader2, ExternalLink, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClinicalFileButton } from "@/components/common/ClinicalFile";
import RadiologyRecordForm from "@/components/radiologist/RadiologyRecordForm";

// Radiologist Portal → authorized patient workspace.
// Opens only for patients whose access request this radiologist satisfied.
// Shows the patient's radiology records and lets the radiologist add a new
// radiology record with a PDF or medical image upload.
export default function RadiologistPatientView({ patient, radiologistProfile, user, onBack }) {
  const [records, setRecords] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      const list = await base44.entities.RadiologyRecord.filter(
        { patient_id: patient.id, radiologist_user_id: user.id },
        "-created_datetime",
        100
      );
      setRecords(list);
    } catch (err) {
      console.error(err);
      setRecords([]);
    }
  };

  useEffect(() => {
    load();
  }, [patient?.id]);

  const formatDateTime = (dt) => {
    if (!dt) return "—";
    const d = new Date(dt);
    return isNaN(d.getTime()) ? String(dt) : d.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Patient</p>
            <h2 className="text-xl font-bold mt-1">{patient.full_name}</h2>
            <p className="text-sm text-primary font-semibold mt-1">CIN: {patient.cin}</p>
            <div className="flex gap-4 mt-3 text-sm">
              {patient.date_of_birth && <span className="text-muted-foreground">DOB: {patient.date_of_birth}</span>}
              {patient.gender && <span className="text-muted-foreground">Gender: {patient.gender}</span>}
              {patient.blood_type && <span className="text-muted-foreground">Blood: {patient.blood_type}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
            <ScanLine className="w-3.5 h-3.5" />
            Patient-authorized access
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">Radiology Records</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Radiology Record
        </Button>
      </div>

      {showForm && (
        <RadiologyRecordForm
          patient={patient}
          radiologistProfile={radiologistProfile}
          user={user}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {records === null ? (
        <div className="flex items-center text-muted-foreground text-sm py-8">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading records...
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No radiology records for this patient yet</p>
          <p className="text-xs mt-1">Create the first record with "New Radiology Record".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                {r.file_type === "pdf" ? (
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.examination_type}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Examination: {formatDateTime(r.examination_datetime)} · Recorded: {formatDateTime(r.created_datetime)}
                  </p>
                  {r.findings && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{r.findings}</p>}
                  {r.file_url && (
                    <ClinicalFileButton
                      kind="radiology_record"
                      id={r.id}
                      fileRef={r.file_url}
                      className="inline-flex items-center gap-1 text-xs text-primary underline mt-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open {r.file_name || "file"}
                    </ClinicalFileButton>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}