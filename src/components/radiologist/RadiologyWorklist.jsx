import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ClipboardList, Loader2 } from "lucide-react";
import { STAGE_LABELS, STAGE_CHIP, STAGE_ORDER, canonicalStage } from "@/lib/radiologyWorkflow";

// Imaging worklist of the dedicated Radiologist Portal. Two sources, one
// workflow: studies the PATIENT authorized this radiologist for, and studies
// the facility's radiology department ASSIGNED to this radiologist (or left
// unassigned for claiming in the department portal). Workflow:
// Request → Review → Schedule → Examination → Images → Reporting →
// Final Report → Released.
const NEXT_ACTION = {
  ready_for_reporting: { action: "start_reporting", label: "Start Reporting" },
  performed: { action: "start_reporting", label: "Start Reporting" },
  reporting_in_progress: { action: "finalize_report", label: "Finalize Report" },
  interpretation: { action: "finalize_report", label: "Finalize Report" },
};
const ACTION_TO_STAGE = {
  start_reporting: "reporting_in_progress",
  finalize_report: "final_report",
};

export default function RadiologyWorklist({ radiologistProfile }) {
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("radiologyGetWorklist", {});
      setItems(res.data.worklist || []);
    } catch (err) {
      setItems([]);
      toast({
        title: "Could not load the imaging worklist",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (item, action) => {
    const key = `${item.id}:${action}`;
    setBusy(key);
    try {
      const res = await base44.functions.invoke("radiologyUpdateWorkflowStatus", {
        request_id: item.id,
        action,
      });
      toast({
        title: action === "flag_critical"
          ? res.data.already_flagged ? "Already flagged as critical" : "Critical finding flagged"
          : "Workflow updated",
        description: action === "flag_critical"
          ? res.data.already_flagged
            ? "This request was already flagged."
            : "The requesting doctor and the patient have been notified."
          : `${item.request_id} is now at the "${STAGE_LABELS[ACTION_TO_STAGE[action]]}" stage.`,
      });
      load();
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

  if (items === null) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading the imaging worklist...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card text-center py-12 text-muted-foreground">
        <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No imaging studies for you yet.</p>
        <p className="text-xs mt-1">
          Studies appear here when a patient explicitly authorizes you, or when your facility's
          radiology department assigns one to you.
        </p>
      </div>
    );
  }

  const sorted = [...items].sort(
    (a, b) => STAGE_ORDER.indexOf(a.stage || canonicalStage(a.workflow_status)) - STAGE_ORDER.indexOf(b.stage || canonicalStage(b.workflow_status))
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">
          Radiology workflow: Submitted → Under Departmental Review → Accepted → Scheduled → Examination →
          Images → Reporting → Final Report → Released. Reporting steps are yours; scheduling and image
          transfer are handled by the department. Submit the report from the patient's imaging request
          before finalizing it.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {sorted.map((item) => {
          const stage = item.stage || canonicalStage(item.workflow_status);
          const next = NEXT_ACTION[stage];
          const busyKey = `${item.id}:${next?.action}`;
          return (
            <div key={item.id} className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {item.patient_name}{" "}
                    <span className="text-muted-foreground font-normal">· {item.patient_cin}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.request_id} · {item.scan_type} — {item.examination}
                    {item.is_assigned && " · assigned to you"}
                    {item.images_count > 0 && ` · ${item.images_count} image file(s)`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Requested by Dr. {item.doctor_name} · {item.doctor_hospital} ·{" "}
                    {item.request_datetime ? new Date(item.request_datetime).toLocaleString() : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Indication: {item.clinical_indication || "—"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STAGE_CHIP[stage] || "bg-secondary"}`}>
                    {STAGE_LABELS[stage]}
                  </span>
                  {item.priority && item.priority !== "Routine" && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-500/10 text-red-600">
                      {item.priority}
                    </span>
                  )}
                  {item.is_critical && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-destructive text-destructive-foreground flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> CRITICAL
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {next && (
                  <Button
                    size="sm"
                    disabled={busy === busyKey}
                    onClick={() => run(item, next.action)}
                  >
                    {busy === busyKey && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                    {next.label}
                  </Button>
                )}
                {stage === "final_report" && (
                  <span className="text-xs text-muted-foreground self-center">
                    Report finalized — awaiting release to the patient record by the department.
                  </span>
                )}
                {stage !== "released" && stage !== "cancelled" && stage !== "final_report" && !item.is_critical && (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy === `${item.id}:flag_critical`}
                    onClick={() => run(item, "flag_critical")}
                  >
                    {busy === `${item.id}:flag_critical` ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 mr-1" />
                    )}
                    Flag Critical Finding
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}