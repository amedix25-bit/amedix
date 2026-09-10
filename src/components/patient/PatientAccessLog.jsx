import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { History, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const formatDateTime = (dt) => {
  if (!dt) return "—";
  const d = new Date(dt);
  return isNaN(d.getTime()) ? String(dt) : d.toLocaleString();
};

const ACTION_LABELS = {
  access_granted: "Access granted",
  access_suspended: "Access suspended",
  access_restored: "Access restored",
  access_declined: "Access declined",
  access_revoked: "Access removed",
};

// Patient → Access & Privacy → Access Log.
// The log stays hidden until the patient clicks the "Access Log" button.
export default function PatientAccessLog({ patientId }) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    if (!open || logs !== null || !patientId) return;
    const load = async () => {
      try {
        const entries = await base44.entities.AccessAuditLog.filter({ patient_id: patientId }, "-datetime");
        setLogs(entries);
      } catch (err) {
        console.error(err);
        setLogs([]);
      }
    };
    load();
  }, [open, patientId]);

  const toggle = () => setOpen((o) => !o);

  return (
    <div>
      <Button variant="outline" onClick={toggle}>
        <History className="w-4 h-4 mr-2" />
        Access Log
        {open ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
      </Button>

      {open && (
        <div className="mt-3">
          {logs === null ? (
            <div className="flex items-center text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No access changes recorded yet.</p>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {logs.map((l) => (
                <div key={l.id} className="flex items-start justify-between gap-3 p-3 text-sm">
                  <p className="min-w-0">
                    <span className="font-medium">{l.doctor_name || "Doctor"}</span> —{" "}
                    {ACTION_LABELS[l.action] || l.action}
                  </p>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDateTime(l.datetime)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}