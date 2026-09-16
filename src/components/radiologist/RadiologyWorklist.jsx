import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ClipboardList, Loader2 } from "lucide-react";

// Imaging Worklist of the dedicated Radiology Portal — every imaging request
// the PATIENT authorized THIS radiologist for, with the radiology workflow
// Request → Scheduled → Performed → Interpretation → Final Report → Released.
// Radiologists only ever see requests they are authorized to access.
const STAGE_LABELS = {
  requested: "Requested",
  scheduled: "Scheduled",
  performed: "Performed",
  interpretation: "Interpretation",
  final_report: "Final Report",
  released: "Released",
};
const NEXT_ACTION = {
  requested: { action: "schedule", label: "Schedule" },
  scheduled: { action: "perform", label: "Mark Performed" },
  performed: { action: "start_interpretation", label: "Start Interpretation" },
  interpretation: { action: "finalize_report", label: "Finalize Report" },
  final_report: { action: "release", label: "Release Report" },
};
const ACTION_TO_STAGE = {
  schedule: "scheduled",
  perform: "performed",
  start_interpretation: "interpretation",
  finalize_report: "final_report",
  release: "released",
};
const STAGE_CHIP = {
  requested: "bg-secondary text-secondary-foreground",
  scheduled: "bg-blue-500/15 text-blue-600",
  performed: "bg-teal-500/15 text-teal-600",
  interpretation: "bg-amber-500/15 text-amber-600",
  final_report: "bg-purple-500/15 text-purple-600",
  released: "bg-emerald-500/15 text-emerald-600",
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
        <p className="text-sm">No authorized imaging requests yet.</p>
        <p className="text-xs mt-1">
          Requests appear here only after a patient explicitly authorizes you for them.
        </p>
      </div>
    );
  }

  const stageOrder = ["requested", "scheduled", "performed", "interpretation", "final_report", "released"];
  const sorted = [...items].sort(
    (a, b) => stageOrder.indexOf(a.workflow_status) - stageOrder.indexOf(b.workflow_status)
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">
          Radiology workflow: Request → Scheduled → Performed → Interpretation → Final Report → Released.
          Every step is timestamped and recorded in the Audit Log. Submit the report from the patient's
          imaging request before finalizing it.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {sorted.map((item) => {
          const next = NEXT_ACTION[item.workflow_status];
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
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STAGE_CHIP[item.workflow_status] || "bg-secondary"}`}>
                    {STAGE_LABELS[item.workflow_status]}
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
                {item.workflow_status !== "released" && !item.is_critical && (
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