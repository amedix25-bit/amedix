import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STAGE_LABELS, STAGE_CHIP, canonicalStage, formatStageTime } from "@/lib/radiologyWorkflow";
import PromptDialog from "./PromptDialog";
import { Loader2, X, AlertTriangle, Paperclip, History, UserCog } from "lucide-react";

// Full imaging request detail for the radiology department: clinical
// information, safety screening, workflow timeline, clarification thread,
// images, assignment panel and every stage action — all respecting the
// department's permissions and recording an audit trail.
export default function DepartmentRequestDialog({ requestId, mode, onClose, onChanged }) {
  const { toast } = useToast();
  const [record, setRecord] = useState(null);
  const [busy, setBusy] = useState("");
  const [prompt, setPrompt] = useState(null);
  const [radiologists, setRadiologists] = useState([]);
  const [assignTo, setAssignTo] = useState("");
  const [assignReason, setAssignReason] = useState("");
  const [signedImages, setSignedImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const isDept = mode === "department";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rec = await base44.entities.ImagingRequest.get(requestId);
        if (!cancelled) setRecord(rec);
      } catch (err) {
        toast({
          title: "Could not load the request",
          description: err.response?.data?.error || err.message,
          variant: "destructive",
        });
      }
    })();
    return () => { cancelled = true; };
  }, [requestId]);

  useEffect(() => {
    if (!record || !isDept) return;
    (async () => {
      try {
        const res = await base44.entities.RadiologistProfile.filter({
          hospital: record.routed_hospital || record.doctor_hospital,
          status: "active",
        });
        setRadiologists(res);
      } catch (err) {
        setRadiologists([]);
      }
    })();
  }, [record?.id, record?.routed_hospital]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!record) return;
    (async () => {
      const uris = record.image_file_urls || [];
      const urls = await Promise.all(uris.map(async (uri) => {
        try {
          const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
          return signed_url;
        } catch (e) { return null; }
      }));
      setSignedImages(urls.filter(Boolean));
    })();
  }, [record?.id, (record?.image_file_urls || []).length]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (action, extra = {}, done) => {
    setBusy(action);
    try {
      const res = await base44.functions.invoke("radiologyDepartmentManage", {
        request_id: record.id,
        action,
        ...extra,
      });
      setRecord(res.data.imaging_request);
      toast({
        title: "Request updated",
        description: `${record.request_id} — now at "${STAGE_LABELS[canonicalStage(res.data.imaging_request.workflow_status)]}".`,
      });
      if (done) done();
      if (onChanged) onChanged();
    } catch (err) {
      toast({
        title: "Action failed",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setBusy("");
    }
  };

  const attachImages = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uris = [];
      for (const file of files) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        uris.push(file_uri);
      }
      await run("images_received", { image_file_urls: uris, image_notes: record.image_notes || "" });
    } catch (err) {
      toast({
        title: "Could not attach the images",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!record) {
    return (
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading the request...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const stage = canonicalStage(record.workflow_status);
  const history = (record.status_history || []).slice().reverse();

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle>Imaging Request {record.request_id}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {record.patient_name} · CIN {record.patient_cin}
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground"><X className="w-5 h-5" /></button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stage + priority */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${STAGE_CHIP[stage] || "bg-secondary"}`}>
              {STAGE_LABELS[stage]}
            </span>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
              {record.priority}
            </span>
            {record.is_critical && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-destructive text-destructive-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> CRITICAL FINDING
              </span>
            )}
          </div>

          {/* Clinical details */}
          <div className="rounded-lg border border-border p-3 text-sm space-y-1.5">
            <p><span className="text-muted-foreground">Modality: </span>{record.scan_type}</p>
            <p><span className="text-muted-foreground">Examination / body region: </span>{record.examination || record.body_part}</p>
            <p><span className="text-muted-foreground">Referring doctor: </span>Dr. {record.doctor_name}{record.doctor_specialization ? ` · ${record.doctor_specialization}` : ""}</p>
            <p><span className="text-muted-foreground">Facility: </span>{record.routed_hospital || record.doctor_hospital}</p>
            <p><span className="text-muted-foreground">Requested: </span>{formatStageTime(record.request_datetime)}</p>
            {record.requested_date && <p><span className="text-muted-foreground">Doctor's preferred date: </span>{record.requested_date}</p>}
            {record.scheduled_datetime && <p><span className="text-muted-foreground">Scheduled: </span>{formatStageTime(record.scheduled_datetime)}</p>}
            <p className="pt-1"><span className="text-muted-foreground">Clinical indication: </span>{record.clinical_indication || "—"}</p>
            <p><span className="text-muted-foreground">Working diagnosis / question: </span>{record.working_diagnosis || "—"}</p>
            {record.contrast && record.contrast !== "Not applicable" && (
              <p><span className="text-muted-foreground">Contrast: </span>{record.contrast}{record.contrast_allergy ? ` · allergy: ${record.contrast_allergy}` : ""}{record.previous_contrast_reaction ? ` · previous reaction: ${record.previous_contrast_reaction}` : ""}</p>
            )}
            {record.scan_type === "MRI" && (
              <p className="text-xs text-muted-foreground">
                MRI safety — implant: {record.mri_metal_implant || "—"} · pacemaker: {record.mri_pacemaker || "—"} · other device: {record.mri_other_device || "—"} · foreign body: {record.mri_metallic_foreign_body || "—"}{record.mri_other_concern ? ` · ${record.mri_other_concern}` : ""}
              </p>
            )}
          </div>

          {/* Clarification thread */}
          {(record.clarification_request || stage === "clarification_required") && (
            <div className="rounded-lg border border-orange-300 bg-orange-50 p-3 text-sm space-y-1">
              <p className="font-medium text-orange-700">Clarification</p>
              <p className="text-orange-800">{record.clarification_request}</p>
              {record.clarification_response && (
                <p className="text-orange-600 text-xs">Doctor's response: {record.clarification_response}</p>
              )}
            </div>
          )}

          {/* Department actions */}
          {isDept && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Department Actions</p>
              <div className="flex flex-wrap gap-2">
                {stage === "requested" && (
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("review")}>Mark Under Review</Button>
                )}
                {["requested", "under_review", "clarification_required"].includes(stage) && (
                  <Button size="sm" disabled={!!busy} onClick={() => run("accept")}>Accept Request</Button>
                )}
                {["requested", "under_review"].includes(stage) && (
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => setPrompt({
                    action: "request_clarification",
                    fields: [{ key: "clarification", label: "Clarification for the referring doctor", type: "textarea", required: true }],
                  })}>Request Clarification</Button>
                )}
                {["requested", "under_review", "accepted"].includes(stage) && (
                  <Button size="sm" disabled={!!busy} onClick={() => setPrompt({
                    action: "schedule",
                    fields: [{ key: "scheduled_for", label: "Schedule the examination for (date & time)", type: "datetime-local" }],
                  })}>Schedule Examination</Button>
                )}
                {stage === "scheduled" && (
                  <Button size="sm" disabled={!!busy} onClick={() => run("start_examination")}>Start Examination</Button>
                )}
                {stage === "in_progress" && (
                  <Button size="sm" disabled={!!busy} onClick={() => run("complete_examination")}>Complete Examination</Button>
                )}
                {["examination_completed", "performed"].includes(stage) && (
                  <Button size="sm" disabled={!!busy} onClick={() => run("images_received", { image_file_urls: [] })}>
                    <Paperclip className="w-4 h-4 mr-1" /> Attach Images & Mark Received
                  </Button>
                )}
                {stage === "images_awaiting_transfer" && (
                  <Button size="sm" disabled={!!busy} onClick={() => run("images_received", { image_file_urls: [] })}>Mark Images Received</Button>
                )}
                {stage === "final_report" && (
                  <Button size="sm" disabled={!!busy} onClick={() => run("release")}>Release Report to Patient Record</Button>
                )}
                {!["released", "cancelled"].includes(stage) && (
                  <Button size="sm" variant="destructive" disabled={!!busy} onClick={() => setPrompt({
                    action: "cancel",
                    fields: [{ key: "reason", label: "Cancellation reason", type: "textarea", required: true }],
                  })}>Cancel Request</Button>
                )}
              </div>
              {["examination_completed", "performed", "images_awaiting_transfer"].includes(stage) && (
                <label className="inline-flex items-center px-3 py-1.5 rounded-md text-sm border border-border hover:bg-accent cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => e.target.files && attachImages(Array.from(e.target.files))}
                  />
                  {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Paperclip className="w-4 h-4 mr-1" />}
                  Upload image files with this action
                </label>
              )}
            </div>
          )}

          {/* Assignment panel */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
              <UserCog className="w-3.5 h-3.5" /> Study Assignment
            </p>
            <p className="text-sm">
              {record.assigned_radiologist_name
                ? `Assigned to ${record.assigned_radiologist_name}${record.assigned_datetime ? ` — ${formatStageTime(record.assigned_datetime)}` : ""}`
                : "Unassigned — the study is available in the department pool."}
            </p>
            {isDept && (
              <div className="space-y-2 pt-1">
                {radiologists.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No active radiologists are registered with this facility yet.</p>
                ) : (
                  <>
                    <Select value={assignTo} onValueChange={setAssignTo}>
                      <SelectTrigger><SelectValue placeholder="Select a radiologist to assign" /></SelectTrigger>
                      <SelectContent>
                        {radiologists.map((r) => (
                          <SelectItem key={r.id} value={r.user_id}>{r.full_name} — {r.specialization}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      rows={2}
                      value={assignReason}
                      onChange={(e) => setAssignReason(e.target.value)}
                      placeholder={record.assigned_radiologist_user_id ? "Reason for reassignment (required)..." : "Reason / note (optional)..."}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={!assignTo || !!busy || (!!record.assigned_radiologist_user_id && !assignReason.trim())}
                        onClick={() => {
                          run("assign", { radiologist_user_id: assignTo, reason: assignReason.trim() });
                          setAssignTo("");
                          setAssignReason("");
                        }}
                      >
                        {busy === "assign" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                        {record.assigned_radiologist_user_id ? "Reassign" : "Assign"}
                      </Button>
                      {record.assigned_radiologist_user_id && (
                        <Button size="sm" variant="outline" disabled={!!busy} onClick={() => setPrompt({
                          action: "unassign",
                          fields: [{ key: "reason", label: "Reason for unassigning", type: "textarea", required: true }],
                        })}>Unassign</Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            {!isDept && !record.assigned_radiologist_user_id && ["ready_for_reporting", "performed"].includes(stage) && (
              <Button size="sm" disabled={busy === "claim"} onClick={() => run("claim")}>
                {busy === "claim" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Claim Study
              </Button>
            )}
            {(record.assignment_history || []).length > 0 && (
              <div className="pt-1 space-y-0.5">
                {record.assignment_history.slice().reverse().map((a, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {a.action} {a.radiologist_name ? `→ ${a.radiologist_name}` : ""} · {a.by_name || "—"}{a.reason ? ` · ${a.reason}` : ""} · {formatStageTime(a.datetime)}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          {signedImages.length > 0 && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Attached Images ({signedImages.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {signedImages.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-border overflow-hidden">
                    <img src={url} alt={`Study image ${i + 1}`} className="w-full h-24 object-cover" />
                  </a>
                ))}
              </div>
              {record.image_notes && <p className="text-xs text-muted-foreground">{record.image_notes}</p>}
            </div>
          )}

          {/* Report */}
          {(record.report || record.report_file_url || record.pdf_url) && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm space-y-1">
              <p className="text-xs font-semibold text-emerald-700 uppercase">Report</p>
              {record.report && <p className="whitespace-pre-wrap">{record.report}</p>}
              {record.report_file_url && (
                <a href={record.report_file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 underline block">Open report file</a>
              )}
              {record.pdf_url && (
                <a href={record.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 underline block">Imaging request PDF</a>
              )}
            </div>
          )}

          {/* Status history */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
              <History className="w-3.5 h-3.5" /> Status History
            </p>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground">No transitions recorded yet.</p>
            ) : (
              <div className="space-y-1.5">
                {history.map((h, i) => (
                  <div key={i} className="text-xs border-l-2 border-border pl-2">
                    <p className="font-medium">
                      {STAGE_LABELS[canonicalStage(h.to)] || h.to}
                      <span className="text-muted-foreground font-normal"> · {h.by_name || "—"} ({h.by_role || "—"})</span>
                    </p>
                    <p className="text-muted-foreground">
                      {formatStageTime(h.datetime)}{h.note ? ` · ${h.note}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {prompt && (
        <PromptDialog
          open
          onOpenChange={(v) => !v && setPrompt(null)}
          title={prompt.action === "schedule" ? "Schedule Examination" : prompt.action === "request_clarification" ? "Request Clarification" : prompt.action === "cancel" ? "Cancel Request" : "Unassign Study"}
          fields={prompt.fields}
          submitLabel="Confirm"
          busy={!!busy}
          onSubmit={(vals, done) => run(prompt.action, vals, done)}
        />
      )}
    </Dialog>
  );
}