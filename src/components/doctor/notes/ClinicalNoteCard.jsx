import React from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, Image as ImageIcon, ExternalLink } from "lucide-react";

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default function ClinicalNoteCard({ note, imagingMap }) {
  const navigate = useNavigate();
  const labIds = note.lab_request_ids || [];
  const imagingIds = note.imaging_request_ids || [];
  const hasManagement = labIds.length > 0 || imagingIds.length > 0 || note.prescription || note.interventions || note.biopsy;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="font-medium">{note.patient_name}</p>
        <span className="text-xs text-muted-foreground">{note.date}</span>
      </div>
      <div className="space-y-3">
        <Field label="History" value={note.history} />
        <Field label="Vital Signs" value={note.vital_signs} />
        <Field label="Physical Examination" value={note.physical_examination} />
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Final Diagnosis</p>
          <p className="text-sm font-medium">{note.diagnosis}</p>
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

        {note.recommendations && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Doctor's Recommendations</p>
            <p className="text-sm whitespace-pre-wrap mt-1">{note.recommendations}</p>
          </div>
        )}
      </div>
    </div>
  );
}