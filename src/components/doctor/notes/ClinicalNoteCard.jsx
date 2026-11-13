import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { FlaskConical, Image as ImageIcon, ExternalLink, Loader2, FileSignature, Lock, ChevronDown, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSpecialtyLabel } from "@/lib/specialtyDocuments";
import { formatStoredValue } from "@/lib/examinations/clinicalExaminations";
import { ResolvedFileButton } from "@/components/radiology/ResolvedFile";
import { loadRequestLogo } from "@/lib/requestPdfLayout";
import { generateClinicalNotePdf } from "@/lib/clinicalNotePdf";

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

// The card is collapsed by default and shows only its header line, so a list of
// notes stays short. Pass `open` + `onToggle` to let the list keep a single note
// open at a time; without them the card manages itself.
export default function ClinicalNoteCard({ note, imagingMap, open, onToggle, defaultOpen = false }) {
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const expanded = open === undefined ? internalOpen : open;
  const toggle = () => (open === undefined ? setInternalOpen((v) => !v) : onToggle && onToggle());
  const labIds = note.lab_request_ids || [];
  const imagingIds = note.imaging_request_ids || [];
  const hasManagement = labIds.length > 0 || imagingIds.length > 0 || note.prescription || note.interventions || note.biopsy;
  const photoCount = Array.isArray(note.photo_file_uris) ? note.photo_file_uris.length : 0;
  const [photoUrls, setPhotoUrls] = useState(null);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // The note as an AMedix official document — same sheet as the laboratory and
  // imaging request forms, generated from the saved record on demand.
  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const [logo, profile] = await Promise.all([
        loadRequestLogo(),
        note.patient_id
          ? base44.entities.PatientProfile.get(note.patient_id).catch(() => null)
          : Promise.resolve(null),
      ]);
      const doc = await generateClinicalNotePdf(note, { logo, profile });
      doc.save(`${note.note_reference || "ClinicalNote"}${note.patient_cin ? `_${note.patient_cin}` : ""}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setPdfLoading(false);
    }
  };

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
      <button
        type="button"
        onClick={toggle}
        className={`w-full flex items-center justify-between gap-2 text-left ${expanded ? "mb-3" : ""}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronDown
            className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          />
          <p className="font-medium truncate">{note.patient_name}</p>
          {note.document_type_label && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
              {note.document_type_label}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{note.date}</span>
      </button>
      <div
        className={`rounded-lg bg-muted/60 border border-border p-3 mb-3 text-sm grid sm:grid-cols-2 lg:grid-cols-3 gap-2 ${
          expanded ? "" : "hidden"
        }`}
      >
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
      <div className={`space-y-3 ${expanded ? "" : "hidden"}`}>
        {note.data && Object.keys(note.data).length > 0 && (
          <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1.5">
            {(() => {
              const entries = Object.entries(note.data)
                .filter(([, f]) => f && f.value !== null && f.value !== undefined && f.value !== "");
              const main = entries.filter(([k]) => !k.startsWith("srh."));
              const sensitive = entries.filter(([k]) => k.startsWith("srh."));
              return (
                <>
                  {main.map(([k, f]) => (
                    <p key={k} className="text-sm whitespace-pre-wrap">
                      <span className="text-muted-foreground">{f.label}: </span>
                      {formatStoredValue(f.value)}
                    </p>
                  ))}
                  {sensitive.length > 0 && (
                    <div className="rounded-lg border border-border bg-background/60 p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide inline-flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Sexual &amp; Reproductive History — Sensitive
                      </p>
                      {sensitive.map(([k, f]) => (
                        <p key={k} className="text-sm whitespace-pre-wrap">
                          <span className="text-muted-foreground">{f.label}: </span>
                          {formatStoredValue(f.value)}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
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
                    <ResolvedFileButton
                      key={id}
                      requestId={id}
                      fileRef={imagingMap[id].pdf_url}
                      className="text-xs text-primary underline inline-flex items-center gap-0.5"
                    >
                      Open PDF <ExternalLink className="w-3 h-3" />
                    </ResolvedFileButton>
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

        <Button variant="outline" size="sm" onClick={downloadPdf} disabled={pdfLoading} className="gap-1.5">
          {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {pdfLoading ? "Preparing PDF..." : "Download PDF"}
        </Button>
      </div>
    </div>
  );
}