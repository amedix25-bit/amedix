import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, AlertTriangle, Hand, ShieldCheck, Siren } from "lucide-react";
import { STAGE_LABELS, STAGE_CHIP } from "@/lib/radiologyWorkflow";
import CasePatientPanel from "@/components/radiologist/case/CasePatientPanel";
import CaseViewerPanel from "@/components/radiologist/case/CaseViewerPanel";
import CaseReportPanel from "@/components/radiologist/case/CaseReportPanel";

// Patient Imaging Case — one study, one screen: compact patient context on the
// left, the imaging workspace in the centre and the structured report on the
// right. Every value comes from the authorized study context endpoint; nothing
// is duplicated or simulated.
export default function ImagingCaseScreen({ requestId, user, radiologistProfile, onBack, onChanged }) {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [pacs, setPacs] = useState(null);
  const [error, setError] = useState("");
  const [comparison, setComparison] = useState(null);
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("radiologyStudyContext", { request_id: requestId });
      setData(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      return;
    }
    try {
      const pacsRes = await base44.functions.invoke("radiologyPacsAccess", { action: "status", request_id: requestId });
      setPacs(pacsRes.data || null);
    } catch {
      // Imaging-system availability must never block reading the request.
      setPacs(null);
    }
  }, [requestId]);

  useEffect(() => {
    setData(null);
    setComparison(null);
    load();
  }, [load]);

  const refresh = () => {
    load();
    if (onChanged) onChanged();
  };

  const claim = async () => {
    setClaiming(true);
    try {
      await base44.functions.invoke("radiologyUpdateWorkflowStatus", { request_id: requestId, action: "claim_study" });
      toast({ title: "Study claimed — now assigned to you" });
      refresh();
    } catch (err) {
      toast({ title: "Claim failed", description: err.response?.data?.error || err.message, variant: "destructive" });
    } finally {
      setClaiming(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to worklist
        </button>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-6 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-600" />
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Opening the imaging case...
      </div>
    );
  }

  const { request, patient, conditions, prior_studies, prior_results, report_versions, draft_reports, imaging_studies } = data;
  const ownership = ["final_report", "released"].includes(request.stage)
    ? "Finalized"
    : request.assigned_radiologist_user_id
      ? request.assigned_radiologist_user_id === user.id ? "Assigned to you" : `Assigned to ${request.assigned_radiologist_name}`
      : "Unassigned";
  const claimable = !request.assigned_radiologist_user_id &&
    ["ready_for_reporting", "performed", "examination_completed"].includes(request.stage);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <button onClick={onBack} className="mt-1 text-muted-foreground hover:text-foreground" title="Back to worklist">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-tight truncate">
              {request.patient_name} <span className="text-muted-foreground font-normal">· CIN {request.patient_cin}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {request.request_id} · {request.scan_type} — {request.examination}
              {request.routed_hospital ? ` · ${request.routed_hospital}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${STAGE_CHIP[request.stage] || "bg-secondary"}`}>
            {STAGE_LABELS[request.stage]}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            ownership === "Assigned to you" ? "bg-blue-500/15 text-blue-700"
            : ownership === "Finalized" ? "bg-emerald-500/15 text-emerald-700"
            : ownership === "Unassigned" ? "bg-amber-500/15 text-amber-700"
            : "bg-purple-500/15 text-purple-700"}`}>
            {ownership}
          </span>
          {request.priority !== "Routine" && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-500/10 text-red-700 flex items-center gap-1">
              <Siren className="w-3 h-3" /> {request.priority}
            </span>
          )}
          {request.is_critical && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-destructive text-destructive-foreground">
              CRITICAL
            </span>
          )}
          {claimable && (
            <Button size="sm" onClick={claim} disabled={claiming}>
              {claiming ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Hand className="w-4 h-4 mr-1" />} Take Case
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[265px_minmax(0,1fr)_385px] gap-3 items-start">
        <CasePatientPanel
          request={request}
          patient={patient}
          conditions={conditions}
          priorStudies={prior_studies}
          priorResults={prior_results}
          onLoadComparison={(study) => setComparison(study)}
        />
        <CaseViewerPanel
          request={request}
          pacs={pacs}
          imagingStudies={imaging_studies}
          comparison={comparison}
          onClearComparison={() => setComparison(null)}
        />
        <CaseReportPanel
          study={request}
          user={user}
          radiologistProfile={radiologistProfile}
          reportVersions={report_versions}
          draftReports={draft_reports}
          onChanged={refresh}
        />
      </div>

      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        Access to this case was authorized server-side for your radiologist account and recorded in the clinical audit trail.
      </p>
    </div>
  );
}