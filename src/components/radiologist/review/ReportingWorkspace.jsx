import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2, Save, Send, Lock, AlertTriangle, Hand, Undo2, Users, FileSignature, CheckCircle2, ExternalLink,
} from "lucide-react";
import { generateRadiologyReportPdf } from "@/lib/radiologyReportPdf";

const SECTIONS = [
  ["findings", "Findings"],
  ["impressions", "Impressions"],
  ["measurements", "Measurements"],
  ["observations", "Observations"],
  ["notes", "Additional Notes"],
];
const EMPTY = { findings: "", impressions: "", measurements: "", observations: "", notes: "" };

// Right panel — the persistent reporting workspace. The radiologist reviews
// images and writes the report in one place. Ownership and concurrency are
// enforced server-side: a study is worked on by one radiologist at a time.
export default function ReportingWorkspace({ study, user, radiologistProfile, onChanged }) {
  const { toast } = useToast();
  const [sections, setSections] = useState(EMPTY);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [busy, setBusy] = useState("");
  const [showSecondOpinion, setShowSecondOpinion] = useState(false);
  const [secondOpinionNote, setSecondOpinionNote] = useState("");

  const stage = study.stage;
  const assignedToMe = study.assigned_radiologist_user_id === user.id;
  const assignedOther = !!study.assigned_radiologist_user_id && !assignedToMe;
  const closed = ["final_report", "released", "cancelled"].includes(stage);
  const claimable = !study.assigned_radiologist_user_id &&
    ["ready_for_reporting", "performed", "examination_completed"].includes(stage);
  const canStart = assignedToMe && ["ready_for_reporting", "performed", "examination_completed"].includes(stage);
  const editable = assignedToMe && ["ready_for_reporting", "performed", "examination_completed", "reporting_in_progress"].includes(stage);

  useEffect(() => {
    let cancelled = false;
    setDraftLoaded(false);
    setHasDraft(false);
    (async () => {
      try {
        const drafts = await base44.entities.ReportDraft.filter({
          request_id: study.id,
          radiologist_user_id: user.id,
        });
        if (!cancelled && drafts.length) {
          setSections({ ...EMPTY, ...(drafts[0].sections || {}) });
          setHasDraft(true);
        }
      } catch (err) {
        console.error(err);
      }
      if (!cancelled) setDraftLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [study.id, user.id]);

  const run = async (key, fn, okTitle) => {
    setBusy(key);
    try {
      await fn();
      toast({ title: okTitle });
      onChanged();
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

  const claim = () =>
    run("claim", () =>
      base44.functions.invoke("radiologyUpdateWorkflowStatus", { request_id: study.id, action: "claim_study" }),
      "Study claimed — it is now assigned to you");

  const startReporting = () =>
    run("start", () =>
      base44.functions.invoke("radiologyUpdateWorkflowStatus", { request_id: study.id, action: "start_reporting" }),
      "Reporting started");

  const saveDraft = () =>
    run("draft", async () => {
      await base44.functions.invoke("radiologyReportDraft", { request_id: study.id, sections });
      setHasDraft(true);
    }, "Draft saved");

  const releaseWork = () =>
    run("release", () =>
      base44.functions.invoke("radiologyUpdateWorkflowStatus", {
        request_id: study.id,
        action: "release_work",
        reason: "Released back to the department pool",
      }),
      "Study released back to the department pool");

  const requestSecondOpinion = () =>
    run("second", () =>
      base44.functions.invoke("radiologyUpdateWorkflowStatus", {
        request_id: study.id,
        action: "request_second_opinion",
        note: secondOpinionNote,
      }),
      "Second opinion requested — the department has been notified");

  const finalize = () =>
    run("finalize", async () => {
      if (!sections.findings.trim()) throw new Error("Findings are required before finalizing the report.");
      const dateStr = new Date().toISOString().slice(0, 10);
      const rows = SECTIONS.filter(([k]) => (sections[k] || "").trim()).map(([k, label]) => [label, sections[k]]);
      const doc = generateRadiologyReportPdf({
        patientName: study.patient_name,
        patientCin: study.patient_cin,
        scanType: study.scan_type,
        examination: study.examination,
        requestRef: study.request_id,
        doctorName: study.doctor_name,
        radiologistName: radiologistProfile?.full_name,
        date: dateStr,
        sections: rows,
      });
      const pdfFile = new File(
        [doc.output("blob")],
        `RadiologyReport_${study.patient_cin}_${dateStr}.pdf`,
        { type: "application/pdf" }
      );
      const { file_url: reportPdfUrl } = await base44.integrations.Core.UploadPublicFile({ file: pdfFile });
      const reportText = rows.map(([h, t]) => `${h}:\n${t.trim()}`).join("\n\n");
      await base44.functions.invoke("radiologyUpdateWorkflowStatus", {
        request_id: study.id,
        action: "finalize_report",
        report: reportText,
        report_pdf_url: reportPdfUrl,
      });
    }, "Report finalized — awaiting release to the patient record");

  const flagCritical = () =>
    run("critical", () =>
      base44.functions.invoke("radiologyUpdateWorkflowStatus", { request_id: study.id, action: "flag_critical" }),
      "Critical finding flagged — the doctor and patient were notified");

  const spinner = (key) => busy === key && <Loader2 className="w-4 h-4 mr-1 animate-spin" />;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 xl:max-h-[calc(100vh-220px)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Reporting Workspace</h3>
        {hasDraft && !closed && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">Draft saved</span>
        )}
      </div>

      {/* Closed — read-only */}
      {closed && (
        <div className="space-y-3">
          <div className="rounded-lg bg-emerald-500/10 p-3 flex items-start gap-2">
            {stage === "cancelled" ? (
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
            )}
            <p className="text-sm text-emerald-800">
              {stage === "cancelled"
                ? "This study was cancelled."
                : stage === "released"
                ? "The report was released to the patient record."
                : "The report is finalized — awaiting release to the patient record by the department."}
            </p>
          </div>
          {study.report && (
            <div className="space-y-2">
              <Label>Final Report</Label>
              <div className="rounded-lg border border-border p-3 text-sm whitespace-pre-wrap">{study.report}</div>
            </div>
          )}
          {study.report_file_url && (
            <a href={study.report_file_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" /> Open Report PDF
              </Button>
            </a>
          )}
        </div>
      )}

      {/* Another radiologist holds the study — concurrency lock */}
      {assignedOther && !closed && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            {stage === "reporting_in_progress" ? "Currently being reported" : "Assigned"} by{" "}
            <span className="font-semibold">{study.assigned_radiologist_name}</span>
            {study.reporting_since ? ` since ${new Date(study.reporting_since).toLocaleString()}` : ""}.
            Editing is locked to prevent duplicate reporting — ask the department for reassignment or a second opinion.
          </p>
        </div>
      )}

      {/* Claimable pool */}
      {claimable && !assignedOther && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This study is unassigned — claim it to start your interpretation.
          </p>
          <Button onClick={claim} disabled={!!busy}>
            {spinner("claim")} <Hand className="w-4 h-4 mr-1" /> Claim Study
          </Button>
        </div>
      )}

      {/* Mine — start reporting */}
      {canStart && (
        <Button onClick={startReporting} disabled={!!busy} className="w-full">
          {spinner("start")} <FileSignature className="w-4 h-4 mr-1" /> Start Reporting
        </Button>
      )}

      {/* The editor */}
      {draftLoaded && !closed && (
        <div className={`space-y-3 ${editable ? "" : "pointer-events-none opacity-50"}`}>
          {SECTIONS.map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}{key === "findings" ? " *" : ""}</Label>
              <Textarea
                rows={key === "findings" ? 5 : 3}
                value={sections[key]}
                onChange={(e) => setSections({ ...sections, [key]: e.target.value })}
                placeholder={label === "Findings" ? "Imaging findings..." : label}
              />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {editable && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" onClick={saveDraft} disabled={!!busy}>
            {spinner("draft")} <Save className="w-4 h-4 mr-1" /> Save Draft
          </Button>
          <Button onClick={finalize} disabled={!!busy}>
            {spinner("finalize")} <Send className="w-4 h-4 mr-1" /> Finalize Report
          </Button>
        </div>
      )}

      {/* Study-level actions for the working radiologist */}
      {(assignedToMe || claimable) && !closed && (
        <div className="pt-2 border-t border-border space-y-2">
          {!study.is_critical && !closed && (
            <Button variant="destructive" size="sm" onClick={flagCritical} disabled={!!busy}>
              {spinner("critical")} <AlertTriangle className="w-4 h-4 mr-1" /> Flag Critical Finding
            </Button>
          )}
          {study.is_critical && (
            <p className="text-xs font-medium text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Flagged as critical — the doctor and patient were notified.
            </p>
          )}
          {assignedToMe && !closed && (
            <Button variant="ghost" size="sm" onClick={releaseWork} disabled={!!busy}>
              {spinner("release")} <Undo2 className="w-4 h-4 mr-1" /> Release to Department Pool
            </Button>
          )}
          {(assignedToMe || claimable) && !closed && !showSecondOpinion && (
            <Button variant="ghost" size="sm" onClick={() => setShowSecondOpinion(true)}>
              <Users className="w-4 h-4 mr-1" /> Request Second Opinion
            </Button>
          )}
          {showSecondOpinion && !closed && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <Label>Why do you need a second opinion?</Label>
              <Textarea rows={2} value={secondOpinionNote} onChange={(e) => setSecondOpinionNote(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" disabled={!!busy || !secondOpinionNote.trim()} onClick={requestSecondOpinion}>
                  {spinner("second")} Send to Department
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowSecondOpinion(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}