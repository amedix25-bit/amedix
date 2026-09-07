import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, CheckCircle2, FileText } from "lucide-react";

const PRIORITY_STYLES = {
  Emergency: "bg-red-100 text-red-700 border-red-300",
  Urgent: "bg-amber-50 text-amber-700 border-amber-300",
  Routine: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function ImagingRequestCard({ img, onUploadReport, onAttachFile }) {
  const [uploading, setUploading] = useState(false);
  const [reportText, setReportText] = useState("");

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Examination / View</p>
          <p className="font-semibold">{img.examination || img.body_part || img.scan_type}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{img.patient_name} · CIN: {img.patient_cin}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {img.priority && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${PRIORITY_STYLES[img.priority] || ""}`}>
              {img.priority}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${img.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {img.status}
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Clinical Indication</p>
          <p className="text-sm">{img.clinical_indication || "—"}</p>
        </div>
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <p className="text-xs font-semibold text-primary uppercase mb-1">Working Diagnosis / Clinical Question</p>
          <p className="text-sm font-medium">{img.working_diagnosis || "—"}</p>
        </div>
      </div>

      {img.contrast && img.contrast !== "Not applicable" && (
        <div className="mt-3 rounded-lg border border-border p-3 text-sm space-y-1">
          <p><span className="text-muted-foreground">Contrast: </span><span className="font-medium">{img.contrast}</span></p>
          {img.contrast_allergy && <p><span className="text-muted-foreground">Contrast allergy: </span>{img.contrast_allergy}</p>}
          {img.previous_contrast_reaction && <p><span className="text-muted-foreground">Previous contrast reaction: </span>{img.previous_contrast_reaction}</p>}
        </div>
      )}

      {img.scan_type === "MRI" && (
        <div className="mt-3 rounded-lg border border-border p-3 text-sm grid sm:grid-cols-2 gap-x-6 gap-y-1">
          <p><span className="text-muted-foreground">Metallic implant: </span>{img.mri_metal_implant || "—"}</p>
          <p><span className="text-muted-foreground">Pacemaker / cardiac device: </span>{img.mri_pacemaker || "—"}</p>
          <p><span className="text-muted-foreground">Other implanted device: </span>{img.mri_other_device || "—"}</p>
          <p><span className="text-muted-foreground">Possible metallic foreign body (eye): </span>{img.mri_metallic_foreign_body || "—"}</p>
          {img.mri_other_concern && <p className="sm:col-span-2"><span className="text-muted-foreground">Other safety concern: </span>{img.mri_other_concern}</p>}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        Requested by Dr. {img.doctor_name}
        {img.doctor_specialization ? ` · ${img.doctor_specialization}` : ""}
        {img.doctor_hospital ? ` · ${img.doctor_hospital}` : ""}
        {" · "}{img.date_requested}{img.request_time ? ` at ${img.request_time}` : ""}
      </p>

      {img.pdf_url && (
        <a href={img.pdf_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary underline">
          <FileText className="w-3.5 h-3.5" /> Request PDF
        </a>
      )}

      {img.status === "requested" && (
        <div className="mt-3 pt-3 border-t border-border">
          {uploading ? (
            <div className="space-y-2">
              <Textarea placeholder="Enter report..." value={reportText} onChange={(e) => setReportText(e.target.value)} rows={2} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onUploadReport(img.id, reportText)}><CheckCircle2 className="w-4 h-4 mr-1" />Save Report</Button>
                <Button size="sm" variant="outline" onClick={() => setUploading(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setUploading(true)}><Upload className="w-4 h-4 mr-1" />Upload Report</Button>
              <label className="cursor-pointer">
                <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm border border-border hover:bg-accent">
                  <Upload className="w-4 h-4 mr-1" />Attach File
                </span>
                <input type="file" className="hidden" onChange={(e) => e.target.files[0] && onAttachFile(img.id, e.target.files[0])} />
              </label>
            </div>
          )}
        </div>
      )}

      {img.status === "completed" && img.report && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <p className="text-sm text-emerald-800">{img.report}</p>
          {img.report_file_url && <a href={img.report_file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 underline mt-2 inline-block">View file</a>}
        </div>
      )}
    </div>
  );
}