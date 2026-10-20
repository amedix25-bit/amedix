import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, AlertTriangle, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STAGE_LABELS, STAGE_CHIP } from "@/lib/radiologyWorkflow";
import StudyContextPanel from "@/components/radiologist/review/StudyContextPanel";
import ImageViewer from "@/components/radiologist/review/ImageViewer";
import ReportingWorkspace from "@/components/radiologist/review/ReportingWorkspace";
import PacsOpenButton from "@/components/radiologist/review/PacsOpenButton";

// Study review screen (Phase 4.3) — three areas in one view:
// left: patient & clinical context · center: image viewer · right: reporting
// workspace. The radiologist never leaves the screen while interpreting.
export default function StudyReviewScreen({ requestId, user, radiologistProfile, onBack, onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [comparison, setComparison] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("radiologyStudyContext", { request_id: requestId });
      setData(res.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message);
    }
  }, [requestId]);

  useEffect(() => {
    setData(null);
    setComparison(null);
    load();
  }, [load]);

  if (error) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to worklist
        </button>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-600" />
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Opening the study...
      </div>
    );
  }

  const { request, patient, conditions, prior_studies, prior_results, report_versions, critical_communications } = data;
  const ownershipLabel = ["final_report", "released"].includes(request.stage)
    ? "Finalized"
    : request.assigned_radiologist_user_id
      ? request.assigned_radiologist_user_id === user.id
        ? "Assigned to you"
        : `Assigned to ${request.assigned_radiologist_name}`
      : "Unassigned";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mt-1">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold">{request.scan_type} — {request.examination}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {request.request_id} · {request.patient_name} · CIN {request.patient_cin}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${STAGE_CHIP[request.stage] || "bg-secondary"}`}>
            {STAGE_LABELS[request.stage]}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            ownershipLabel === "Assigned to you" ? "bg-teal-500/15 text-teal-700"
            : ownershipLabel === "Finalized" ? "bg-emerald-500/15 text-emerald-700"
            : ownershipLabel === "Unassigned" ? "bg-amber-500/15 text-amber-700"
            : "bg-purple-500/15 text-purple-700"}`}>
            {ownershipLabel}
          </span>
          {request.priority !== "Routine" && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-500/10 text-red-600">{request.priority}</span>
          )}
          {request.is_critical && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-destructive text-destructive-foreground">CRITICAL</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)_400px] gap-4 items-start">
        <StudyContextPanel
          request={request}
          patient={patient}
          conditions={conditions}
          priorStudies={prior_studies}
          priorResults={prior_results}
          onLoadComparison={(study) => setComparison(study)}
        />
        <div className="space-y-3">
          <PacsOpenButton requestId={request.id} />
          <ImageViewer
            images={request.image_file_urls}
            requestId={request.id}
            comparisonImages={comparison ? comparison.images : undefined}
            comparisonRequestId={comparison ? comparison.id : undefined}
            comparisonLabel={comparison ? `${comparison.scan_type} — ${comparison.examination}` : ""}
          />
          {request.image_notes && (
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Department Image Notes</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{request.image_notes}</p>
            </div>
          )}
          {comparison && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <GitCompare className="w-3.5 h-3.5" />
              Comparing against {comparison.request_id} — switch tabs in the viewer.
            </p>
          )}
        </div>
        <ReportingWorkspace
          study={request}
          user={user}
          radiologistProfile={radiologistProfile}
          reportVersions={report_versions}
          onChanged={() => {
            load();
            if (onChanged) onChanged();
          }}
        />
      </div>
    </div>
  );
}