import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, CheckCircle2, FileText, Send, Loader2, ShieldAlert, CircleCheck } from "lucide-react";
import { STAGE_LABELS, STAGE_CHIP, canonicalStage, formatStageTime } from "@/lib/radiologyWorkflow";
import { ResolvedFileButton } from "@/components/radiology/ResolvedFile";
import { ClinicalFileButton } from "@/components/common/ClinicalFile";

const PRIORITY_STYLES = {
  Emergency: "bg-red-100 text-red-700 border-red-300",
  Urgent: "bg-amber-50 text-amber-700 border-amber-300",
  Routine: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function ImagingRequestCard({ img, sharedResult, onUploadReport, onAttachFile, onRespondClarification }) {
  const [uploading, setUploading] = useState(false);
  const [reportText, setReportText] = useState("");
  const [clarification, setClarification] = useState("");
  const [responding, setResponding] = useState(false);
  const [criticalLog, setCriticalLog] = useState(null);
  const [criticalAcked, setCriticalAcked] = useState(null);
  const [ackBusy, setAckBusy] = useState(false);

  // Critical findings communication (Phase 6) — the responsible clinician
  // acknowledges the critical result here.
  useEffect(() => {
    if (!img.is_critical) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("radiologyCriticalComm", { action: "list", request_id: img.id });
        if (cancelled) return;
        const logs = res.data.logs || [];
        setCriticalLog(logs.find((l) => ["notified", "delivered", "escalated"].includes(l.status)) || null);
        setCriticalAcked(logs.find((l) => l.acknowledged_datetime) || null);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { cancelled = true; };
  }, [img.id, img.is_critical]);

  const acknowledgeCritical = async () => {
    setAckBusy(true);
    try {
      await base44.functions.invoke("radiologyCriticalComm", {
        action: "acknowledge",
        log_id: criticalLog.id,
        note: "Acknowledged in the Doctor Portal",
      });
      setCriticalAcked({ acknowledged_datetime: new Date().toISOString(), acknowledged_by_name: "You" });
      setCriticalLog(null);
    } catch (err) {
      console.error(err);
    } finally {
      setAckBusy(false);
    }
  };

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
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_CHIP[canonicalStage(img.workflow_status)] || (img.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}`}>
            {STAGE_LABELS[canonicalStage(img.workflow_status)] || img.status}
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

      {/* Radiology department workflow timestamps */}
      {canonicalStage(img.workflow_status) !== "requested" && (
        <div className="mt-3 rounded-lg border border-border p-3 text-xs space-y-1">
          <p className="font-semibold text-muted-foreground uppercase">Radiology Department Progress</p>
          <p><span className="text-muted-foreground">Scheduled: </span>{formatStageTime(img.scheduled_datetime) || "—"}</p>
          <p><span className="text-muted-foreground">Images received: </span>{formatStageTime(img.images_received_datetime) || "—"}</p>
          <p><span className="text-muted-foreground">Ready for reporting: </span>{formatStageTime(img.ready_datetime) || "—"}</p>
          <p><span className="text-muted-foreground">Examination completed: </span>{formatStageTime(img.performed_datetime) || "—"}</p>
          <p><span className="text-muted-foreground">Report finalized: </span>{formatStageTime(img.final_report_datetime) || "—"}</p>
          <p><span className="text-muted-foreground">Released to record: </span>{formatStageTime(img.released_datetime) || "—"}</p>
        </div>
      )}

      {/* Finalized report — authorized access for the requesting doctor (Phase 8.1) */}
      {["final_report", "released"].includes(canonicalStage(img.workflow_status)) && (img.report || img.report_file_url) && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold text-emerald-700 uppercase mb-1">Finalized Report</p>
          {img.report && <p className="text-sm text-emerald-900 whitespace-pre-wrap">{img.report}</p>}
          {img.report_file_url && (
            <ResolvedFileButton requestId={img.id} fileRef={img.report_file_url} className="text-xs text-emerald-600 underline mt-2 inline-block">
              Open Report (PDF)
            </ResolvedFileButton>
          )}
        </div>
      )}

      {/* Department clarification — the doctor responds here */}
      {canonicalStage(img.workflow_status) === "clarification_required" && img.clarification_request && (
        <div className="mt-3 rounded-lg border border-orange-300 bg-orange-50 p-3 space-y-2">
          <p className="text-sm font-medium text-orange-700">
            The radiology department requested clarification: {img.clarification_request}
          </p>
          {img.clarification_response ? (
            <p className="text-xs text-orange-600">Your response: {img.clarification_response}</p>
          ) : (
            <div className="space-y-2">
              <Textarea rows={2} value={clarification} onChange={(e) => setClarification(e.target.value)} placeholder="Respond to the department's clarification..." />
              <Button
                size="sm"
                disabled={responding || !clarification.trim()}
                onClick={async () => {
                  setResponding(true);
                  try {
                    await onRespondClarification(img.id, clarification.trim());
                    setClarification("");
                  } finally {
                    setResponding(false);
                  }
                }}
              >
                {responding && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Send Response
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Critical findings communication (Phase 6) */}
      {img.is_critical && (
        <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 space-y-2">
          <p className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> Critical Imaging Finding
          </p>
          {criticalLog ? (
            <>
              <p className="text-xs text-red-600">
                Awaiting your acknowledgment — communicated via {criticalLog.notification_method || "in-app"}
                {criticalLog.notified_datetime ? ` · ${new Date(criticalLog.notified_datetime).toLocaleString()}` : ""}
                {criticalLog.escalation_level > 0 ? ` · escalated ×${criticalLog.escalation_level}` : ""}.
              </p>
              {criticalLog.finding_summary && (
                <p className="text-xs text-red-700 font-medium">{criticalLog.finding_summary}</p>
              )}
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" disabled={ackBusy} onClick={acknowledgeCritical}>
                {ackBusy && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Acknowledge Critical Finding
              </Button>
            </>
          ) : criticalAcked ? (
            <p className="text-xs text-emerald-700 flex items-center gap-1.5">
              <CircleCheck className="w-3.5 h-3.5" />
              Acknowledged {criticalAcked.acknowledged_datetime ? new Date(criticalAcked.acknowledged_datetime).toLocaleString() : ""}
            </p>
          ) : (
            <p className="text-xs text-red-600">A critical finding was identified on this study — the radiology team will communicate it with you.</p>
          )}
        </div>
      )}

      {sharedResult && (
        <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
          <p className="text-xs font-semibold text-emerald-700 uppercase flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5" /> Result Shared by Patient
          </p>
          <p className="text-sm text-emerald-800 mt-1">{sharedResult.message || sharedResult.title}</p>
          {sharedResult.datetime && (
            <p className="text-xs text-emerald-600 mt-1">Shared {new Date(sharedResult.datetime).toLocaleString()}</p>
          )}
          {sharedResult.report_pdf_url && (
            <ClinicalFileButton kind="imaging_result" id={sharedResult.id} fileRef={sharedResult.report_pdf_url} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-3 text-sm font-medium mt-2">
              <FileText className="w-4 h-4 mr-1" /> Open Report (PDF)
            </ClinicalFileButton>
          )}
        </div>
      )}

      {img.pdf_url && (
        <ResolvedFileButton requestId={img.id} fileRef={img.pdf_url} className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary underline">
          <FileText className="w-3.5 h-3.5" /> Request PDF
        </ResolvedFileButton>
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