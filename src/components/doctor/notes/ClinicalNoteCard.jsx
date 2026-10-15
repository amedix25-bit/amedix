import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { FlaskConical, Image as ImageIcon, ExternalLink, Loader2, FileSignature } from "lucide-react";
import { getSpecialtyLabel } from "@/lib/specialtyDocuments";

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function formatSeen(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return `${d.toLocaleDateString()} — ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default function ClinicalNoteCard({ note, imagingMap }) {
  const navigate = useNavigate();
  const labIds = note.lab_request_ids || [];
  const imagingIds = note.imaging_request_ids || [];
  const hasManagement = labIds.length > 0 || imagingIds.length > 0 || note.prescription || note.interventions || note.biopsy;
  const photoCount = Array.isArray(note.photo_file_uris) ? note.photo_file_uris.length : 0;
  const [photoUrls, setPhotoUrls] = useState(null);
  const [photosLoading, setPhotosLoading] = useState(false);

  // Clinical photographs live in private storage — signed URLs are issued by
  // the backend only after permission checks, and every view is audit-logged.
  useEffect(() => {
    if (photoCount > 0) {
      setPhotosLoading(true);
      setPhotoUrls(null);
      base44.functions.invoke("getDocumentPhotos", { document_record_id: note.id, record_type: "clinical_note" })
        .then((res) => setPhotoUrls(res.data?.photos || []))
        .catch(() => setPhotoUrls([]))
        .finally(() => setPhotosLoading(false));
    } else {
      setPhotoUrls(null);
      setPhotosLoading(false);
    }
  }, [note.id, photoCount]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-medium truncate">{note.patient_name}</p>
          {note.document_type_label && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
              {note.document_type_label}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{note.date}</span>
      </div>
      <div className="rounded-lg bg-muted/60 border border-border p-3 mb-3 text-sm grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Patient</p>
          <p className="font-medium">{note.patient_name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">CIN</p>
          <p className="font-medium">{note.patient_cin || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Date of Birth</p>
          <p className="font-medium">{note.patient_dob || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Doctor</p>
          <p className="font-medium">{note.doctor_name || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Specialty</p>
          <p className="font-medium">{note.specialty ? getSpecialtyLabel(note.specialty) : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Date/Time Seen</p>
          <p className="font-medium">{formatSeen(note.encounter_datetime)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Location</p>
          <p className="font-medium">{note.location || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Hospital / Clinic</p>
          <p className="font-medium">{note.hospital || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Department</p>
          <p className="font-medium">{note.department || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Visit ID</p>
          <p className="font-medium">{note.encounter_id || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Note Reference</p>
          <p className="font-medium">{note.note_reference || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Allergies</p>
          <p className="font-medium">{note.allergies || "None recorded"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Current Medications</p>
          <p className="font-medium">{(note.current_medications || []).join(", ") || "None"}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-muted-foreground">Previous History</p>
          <p className="font-medium">{note.previous_history || "No recorded history"}</p>
        </div>
      </div>
      <div className="space-y-3">
        {note.data && Object.keys(note.data).length > 0 && (
          <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1.5">
            {Object.entries(note.data)
              .filter(([, f]) => f && f.value !== null && f.value !== undefined && f.value !== "")
              .map(([k, f]) => (
                <p key={k} className="text-sm">
                  <span className="text-muted-foreground">{f.label}: </span>
                  {f.value}
                </p>
              ))}
          </div>
        )}
        <Field label="History" value={note.history} />
        <Field label="Vital Signs" value={note.vital_signs} />
        <Field label="Physical Examination" value={note.physical_examination} />
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Provisional Diagnosis</p>
          {(Array.isArray(note.provisional_diagnoses) && note.provisional_diagnoses.length > 0
            ? note.provisional_diagnoses
            : [note.diagnosis]
          )
            .filter(Boolean)
            .map((d, i) => (
              <p key={i} className="text-sm font-medium">
                {i + 1}. {d}
              </p>
            ))}
        </div>

        {hasManagement && (
          <div className="rounded-lg bg-muted p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Management</p>
            {labIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <FlaskConical className="w-4 h-4 text-muted-foreground" />
                <span>Lab request made ({labIds.length})</span>
                {labIds.map((id) => (
                  <button
                    key={id}
                    onClick={() => navigate(`/doctor/lab-request/${id}`)}
                    className="text-xs text-primary underline inline-flex items-center gap-0.5"
                  >
                    Open request <ExternalLink className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
            {imagingIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                <span>Imaging request made ({imagingIds.length})</span>
                {imagingIds.map((id) =>
                  imagingMap?.[id]?.pdf_url ? (
                    <button
                      key={id}
                      onClick={() => window.open(imagingMap[id].pdf_url, "_blank")}
                      className="text-xs text-primary underline inline-flex items-center gap-0.5"
                    >
                      Open PDF <ExternalLink className="w-3 h-3" />
                    </button>
                  ) : null
                )}
              </div>
            )}
            <Field label="Prescriptions" value={note.prescription} />
            <Field label="Interventions" value={note.interventions} />
            <Field label="Biopsy" value={note.biopsy} />
          </div>
        )}

        {photoCount > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Clinical Photographs ({photoCount})
            </p>
            {photosLoading ? (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading photographs...
              </p>
            ) : photoUrls && photoUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {photoUrls.map((url, i) => (
                  <Image
                    key={url}
                    src={url}
                    alt={`Clinical photograph ${i + 1}`}
                    fittingType="fit"
                    className="w-full aspect-square rounded-lg border border-border overflow-hidden"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Photographs are restricted — you are not authorized to view them.
              </p>
            )}
          </div>
        )}

        {note.recommendations && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Doctor's Recommendations</p>
            <p className="text-sm whitespace-pre-wrap mt-1">{note.recommendations}</p>
          </div>
        )}

        {note.signed_by_name && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <p className="text-sm font-semibold text-primary flex items-center gap-1.5">
              <FileSignature className="w-4 h-4" />
              Electronically signed by Dr. {note.signed_by_name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {note.signed_datetime ? new Date(note.signed_datetime).toLocaleString() : ""}
              {note.note_reference ? ` · ${note.note_reference}` : ""}
              {note.encounter_id ? ` · Visit: ${note.encounter_id}` : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}